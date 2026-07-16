# Excel 导入测试数据

本目录下的 `.xlsx` 文件由 `test-data/generate_test_excel.py` 生成（`python test-data/generate_test_excel.py` 可重新生成），用于测试 `POST /api/import/upload` 接口。

## 文件清单与上传顺序

数据之间有依赖关系，建议按以下顺序上传（`importType` 为接口参数）：

| 顺序 | 文件 | importType | 依赖 |
|---|---|---|---|
| 1 | teacher.xlsx | `TEACHER` | 无 |
| 2 | student.xlsx | `STUDENT` | 无 |
| 3 | course.xlsx | `COURSE` | 教师工号 T101~T103（第 1 步导入） |
| 4 | CS101_CLASS_STUDENT_软件2101.xlsx | `CLASS_STUDENT` | 课程 CS101（种子数据 course.csv） |
| 5 | CS101_ATTENDANCE_第1周.xlsx | `ATTENDANCE` | 课程 CS101 + 学生（第 2/4 步导入） |
| 6 | CS101_EXPERIMENT_实验一.xlsx | `EXPERIMENT` | 同上 |
| 7 | CS101_HOMEWORK_第1次作业.xlsx | `HOMEWORK` | 同上 |
| 8 | CS101_QUIZ_第1次测验.xlsx | `QUIZ` | 同上 |
| 9 | CS101_EXAM_SCORE_MIDTERM_期中考试.xlsx | `EXAM_SCORE` | 同上 |

curl 示例：

```bash
curl -X POST http://localhost:8080/api/import/upload \
  -F "file=@test-data/excel/teacher.xlsx" \
  -F "importType=TEACHER"
```

## 格式约定（重要）

上传的表格**必须是固定格式**，否则无法识别入库：

### 1. 按表头匹配的类型（教师/学生/课程/班级学生/考勤/实验）

- 列映射靠**表头文字精确匹配**（对应各 `dto/excel/*ExcelDTO` 的 `@ExcelProperty` 注解）
- 列的先后顺序可以调换，但表头文字一字不能差（如"学号"写成"学生学号"则该列映射失败，字段为 null，行会被跳过）
- 多余的列会被忽略
- 各类型必需表头：
  - 教师：`工号, 姓名, 性别, 学院, 系/部门, 职称, 邮箱, 联系电话`
  - 学生/班级学生：`学号, 姓名, 性别, 学院, 专业, 班级, 年级, 邮箱`
  - 课程：`课程编号, 课程名称, 授课教师工号, 学分, 课程类型, 学期, 课程描述`
  - 考勤：`学号, 姓名, 日期, 状态, 节次, 第几周, 备注`
  - 实验：`学号, 姓名, 实验名称, 实验次数, 分数, 提交时间, 备注`

### 2. 按列位置匹配的类型（作业/测验/考试成绩）

- 列顺序**固定不可调换**：`序号 | 学号 | 姓名 | 第1题得分 | 扣分知识点 | ... | 第N题得分 | 扣分知识点 | 总成绩 | 最薄弱知识点`
- 题目数量由表头中的 `第X题得分` 自动检测（检测不到时默认 5 题）
- **文件名本身携带元数据**，格式不对会直接导入失败：
  - 作业：`{课程编号}_HOMEWORK_{考核名称}.xlsx`
  - 测验：`{课程编号}_QUIZ_{考核名称}.xlsx`
  - 考试：`{课程编号}_EXAM_SCORE_MIDTERM_{名称}.xlsx` 或 `..._FINAL_...`（也兼容 `{课程编号}_MIDTERM_{名称}.xlsx`）
  - 班级名单/考勤/实验同理：`{课程编号}_CLASS_STUDENT_{班级}.xlsx`、`{课程编号}_ATTENDANCE_{描述}.xlsx`、`{课程编号}_EXPERIMENT_{描述}.xlsx`

### 3. 支持的文件格式

`.xlsx`、`.xls`、`.csv`（CSV 需 UTF-8 编码）。

> 提示：`GET /api/import/template/{importType}` 可下载各类型的空白模板。
