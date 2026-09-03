# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Test Commands

```bash
# Build and run all tests (uses Maven wrapper — no local Maven install needed)
./mvnw clean test

# Compile only (skip tests)
./mvnw compile

# Run a single test class
./mvnw test -Dtest=EvaluationServiceImplTest

# Run a single test method
./mvnw test -Dtest=EvaluationServiceImplTest#shouldCalculateCorrectly_WhenMultipleStudentsRate

# Start the application (requires MySQL on localhost:3306)
./mvnw spring-boot:run

# JaCoCo coverage report (generated automatically during test phase, see target/site/jacoco/)
```

## Tech Stack

- **Java 21**, **Spring Boot 3.4.5**, **Maven** (wrapper included)
- **MyBatis Plus 3.5.9** (ORM, `MybatisPlusConfig` scans `com.example.aitaes.mapper`)
- **MySQL** (production DB `aitaes_db`), **H2** (test DB, in-memory)
- **Redis** (Spring Session), **EasyExcel 3.3.2** (import/export), **Lombok**
- **JUnit 5 + Mockito** (testing), **JaCoCo** (coverage)

## Architecture Overview

Standard layered architecture: **Controller → Service (interface) → ServiceImpl → Mapper → Entity**

```
controller/          REST API endpoints, thin — delegates to services
service/             Service interfaces
service/impl/        Service implementations (business logic)
mapper/              MyBatis Plus BaseMapper interfaces (XML optional)
entity/              DB table mappings (@TableName)
dto/                 Data transfer objects (request/response payloads)
dto/excel/           DTOs for EasyExcel row mapping
common/              Result<T>, ResultCode enum, BusinessException, GlobalExceptionHandler
config/              MyBatis Plus MapperScan config
strategy/            Import strategy pattern (see below)
listener/            Generic Excel read listener (callback-based)
enums/               ImportType, ImportStatus
```

### Key Design Patterns

**Strategy Pattern for Data Import**: `ImportStrategy` interface (one impl per data type) + `ImportStrategyFactory` auto-discovers all strategies via Spring constructor injection. To add a new import type: implement `ImportStrategy`, mark `getSupportedType()` with the new `ImportType` enum value, and annotate with `@Component`. No factory code changes needed.

**Generic Excel Listener** (`GenericExcelListener<T>`): Uses a `Consumer<List<T>>` callback for batch processing. Decouples EasyExcel parsing from business logic. Supports row-level fault tolerance — parse errors skip individual rows without aborting the entire import. Configurable batch size (default 500, set via `aitaes.import.batch-size`).

**Unified API Response**: All endpoints return `Result<T>` with fields `code` (mirrors HTTP status), `message`, `data`. Never returns raw entities or exceptions — `GlobalExceptionHandler` (`@RestControllerAdvice`) catches everything and converts to `Result`.

### Business Domain

**AITAES** (AI-powered Teaching Analysis System) — v3.0 refactored into a full teaching analysis platform.

**4 user roles** sharing a unified `t_user` auth table: `ADMIN` (manages teacher accounts), `TEACHER` (manages their courses/students), `ASSISTANT` (scoped permissions assigned by teacher), `STUDENT` (views own data).

**Semester format**: `YYYY-YYYY-N` (e.g. `2025-2026-1`).

### Configuration

- `application.yml` — datasource, MyBatis Plus, multipart limits (10MB), business config under `aitaes.*`
- MyBatis Plus uses `map-underscore-to-camel-case: true`, logic delete field `deleted`, auto-increment IDs
- Default profile uses MySQL at `localhost:3306/aitaes_db` (root/1234); tests use H2 auto-configured by Spring Boot

### API Modules

| Module | Base Path | Purpose |
|--------|-----------|---------|
| Data Import | `/api/import` | Excel/CSV upload, type-routed to strategy |
| Data Source | `/api/datasource` | CRUD for data source configurations |

Full API documentation is in [docs/api-documentation.md](docs/api-documentation.md). Database schema in [docs/database-design.md](docs/database-design.md).

### Test Conventions

- Tests use **Given-When-Then** structure with `@DisplayName` annotations
- Unit tests use `@ExtendWith(MockitoExtension.class)` + `@Mock` / `@InjectMocks`
- Test classes organized with `@Nested` inner classes for method-level grouping
- Test data factory methods follow the pattern `buildXxx()` / `createXxx()` within test classes
- H2 in-memory DB for integration tests (auto-detected, no separate config)

### Key Dependencies

- **MyBatis Plus**: Use `LambdaQueryWrapper` for type-safe queries (e.g. `.eq(Course::getTeacherId, teacherId)`)
- **EasyExcel**: Read via `EasyExcel.read(inputStream, DTO.class, listener).sheet().doRead()`
- **Lombok**: `@Data` on entities/DTOs, `@RequiredArgsConstructor` for constructor injection, `@Slf4j` for logging
- Use `BeanUtils.copyProperties()` for entity↔DTO conversion
