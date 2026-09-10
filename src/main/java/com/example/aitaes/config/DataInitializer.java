package com.example.aitaes.config;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.entity.*;
import com.example.aitaes.mapper.*;
import com.example.aitaes.util.PasswordUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Random;

/**
 * 数据初始化器 — 应用启动时自动初始化种子用户数据和测试数据
 * <p>
 * 仅在非 test profile 下运行：JUnit 集成测试用 @Sql 自建 schema/数据，
 * 若在测试上下文启动时执行本类会因 H2 空库（表尚未创建）而导致上下文加载失败。
 */
@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserMapper userMapper;
    private final TeacherMapper teacherMapper;
    private final StudentMapper studentMapper;
    private final CourseMapper courseMapper;
    private final CourseStudentMapper courseStudentMapper;
    private final AssessmentMapper assessmentMapper;
    private final AssessmentRecordMapper assessmentRecordMapper;
    private final AttendanceMapper attendanceMapper;
    private final ExperimentMapper experimentMapper;
    private final StudentKpMasteryMapper studentKpMasteryMapper;
    private final QuestionBankMapper questionBankMapper;
    private final ExamPaperMapper examPaperMapper;

    private Long teacher1Id;
    private Long teacher2Id;
    private Long student1Id;
    private Long student2Id;
    private Long courseId;

    private final Random random = new Random(42);

    @Override
    public void run(String... args) {
        log.info("开始初始化种子数据...");

        initAdminUser();
        initTeacherUsers();
        initStudentUsers();

        // 每个模块独立检查，确保即使部分数据已存在也能补充缺失数据
        initCourses();
        initCourseStudents();
        initAssessments();
        initAttendance();
        initExperiments();
        initKnowledgeMastery();
        initQuestionBank();
        initExamPapers();

        log.info("种子数据初始化完成");
    }

    /**
     * 初始化管理员账号
     */
    private void initAdminUser() {
        User admin = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, "admin"));

        if (admin == null) {
            admin = new User();
            admin.setUsername("admin");
            admin.setPassword(PasswordUtil.encode("admin123"));
            admin.setRole("ADMIN");
            admin.setStatus("ACTIVE");
            admin.setFirstLogin(0);
            userMapper.insert(admin);
            log.info("初始化管理员账号: admin / admin123");
        } else {
            log.debug("管理员账号已存在，跳过初始化");
        }
    }

    /**
     * 初始化教师账号
     */
    private void initTeacherUsers() {
        // 教师1: T00001
        User teacher1User = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, "T00001"));

        if (teacher1User == null) {
            teacher1User = new User();
            teacher1User.setUsername("T00001");
            teacher1User.setPassword(PasswordUtil.encode("123456"));
            teacher1User.setRole("TEACHER");
            teacher1User.setStatus("ACTIVE");
            teacher1User.setFirstLogin(0);
            userMapper.insert(teacher1User);

            Teacher teacher1 = new Teacher();
            teacher1.setUserId(teacher1User.getId());
            teacher1.setTeacherNo("T00001");
            teacher1.setName("张建国");
            teacher1.setGender("男");
            teacher1.setCollege("计算机学院");
            teacher1.setDepartment("软件工程系");
            teacher1.setTitle("教授");
            teacher1.setEmail("zjg@university.edu.cn");
            teacherMapper.insert(teacher1);

            log.info("初始化教师账号: T00001 / 123456 (张建国)");
            teacher1Id = teacher1.getId();
            log.info("教师1 ID: {}", teacher1Id);
        } else {
            teacher1Id = teacherMapper.selectOne(new LambdaQueryWrapper<Teacher>()
                    .eq(Teacher::getTeacherNo, "T00001")).getId();
            log.debug("教师账号 T00001 已存在，跳过初始化");
        }

        // 教师2: T00002
        User teacher2User = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, "T00002"));

        if (teacher2User == null) {
            teacher2User = new User();
            teacher2User.setUsername("T00002");
            teacher2User.setPassword(PasswordUtil.encode("123456"));
            teacher2User.setRole("TEACHER");
            teacher2User.setStatus("ACTIVE");
            teacher2User.setFirstLogin(0);
            userMapper.insert(teacher2User);

            Teacher teacher2 = new Teacher();
            teacher2.setUserId(teacher2User.getId());
            teacher2.setTeacherNo("T00002");
            teacher2.setName("李美玲");
            teacher2.setGender("女");
            teacher2.setCollege("计算机学院");
            teacher2.setDepartment("网络工程系");
            teacher2.setTitle("副教授");
            teacher2.setEmail("lml@university.edu.cn");
            teacherMapper.insert(teacher2);

            log.info("初始化教师账号: T00002 / 123456 (李美玲)");
            teacher2Id = teacher2.getId();
        } else {
            teacher2Id = teacherMapper.selectOne(new LambdaQueryWrapper<Teacher>()
                    .eq(Teacher::getTeacherNo, "T00002")).getId();
            log.debug("教师账号 T00002 已存在，跳过初始化");
        }
    }

    /**
     * 初始化学生账号
     */
    private void initStudentUsers() {
        // 学生1: 202426010101
        User student1User = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, "202426010101"));

        if (student1User == null) {
            student1User = new User();
            student1User.setUsername("202426010101");
            student1User.setPassword(PasswordUtil.encode("123456"));
            student1User.setRole("STUDENT");
            student1User.setStatus("ACTIVE");
            student1User.setFirstLogin(0);
            userMapper.insert(student1User);

            Student student1 = new Student();
            student1.setUserId(student1User.getId());
            student1.setStudentNo("202426010101");
            student1.setName("张伟");
            student1.setGender("男");
            student1.setCollege("计算机学院");
            student1.setMajor("计算机科学与技术");
            student1.setClassName("计科2401");
            student1.setGrade("2024");
            student1.setEmail("202426010101@student.edu.cn");
            studentMapper.insert(student1);

            log.info("初始化学生账号: 202426010101 / 123456 (张伟)");
            student1Id = student1.getId();
        } else {
            student1Id = studentMapper.selectOne(new LambdaQueryWrapper<Student>()
                    .eq(Student::getStudentNo, "202426010101")).getId();
            log.debug("学生账号 202426010101 已存在，跳过初始化");
        }

        // 学生2: 202407010101
        User student2User = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, "202407010101"));

        if (student2User == null) {
            student2User = new User();
            student2User.setUsername("202407010101");
            student2User.setPassword(PasswordUtil.encode("123456"));
            student2User.setRole("STUDENT");
            student2User.setStatus("ACTIVE");
            student2User.setFirstLogin(0);
            userMapper.insert(student2User);

            Student student2 = new Student();
            student2.setUserId(student2User.getId());
            student2.setStudentNo("202407010101");
            student2.setName("李娜");
            student2.setGender("女");
            student2.setCollege("数学学院");
            student2.setMajor("应用数学");
            student2.setClassName("应数2401");
            student2.setGrade("2024");
            student2.setEmail("202407010101@student.edu.cn");
            studentMapper.insert(student2);

            log.info("初始化学生账号: 202407010101 / 123456 (李娜)");
            student2Id = student2.getId();
        } else {
            student2Id = studentMapper.selectOne(new LambdaQueryWrapper<Student>()
                    .eq(Student::getStudentNo, "202407010101")).getId();
            log.debug("学生账号 202407010101 已存在，跳过初始化");
        }
    }

    /**
     * 初始化课程（本项目仅保留「计算机网络」一门课）
     */
    private void initCourses() {
        Course course = courseMapper.selectOne(new LambdaQueryWrapper<Course>()
                .eq(Course::getCourseNo, "CS05102"));
        if (course == null) {
            Course c = new Course();
            c.setCourseNo("CS05102");
            c.setCourseName("计算机网络");
            c.setTeacherId(teacher1Id);
            c.setCredit(new BigDecimal("3.0"));
            c.setCourseType("必修");
            c.setSemester("2025-2026-1");
            c.setDescription("网络通信原理与实践");
            courseMapper.insert(c);
            courseId = c.getId();
            log.info("创建课程: {} (ID={})", c.getCourseName(), courseId);
        } else {
            courseId = course.getId();
        }
    }

    /**
     * 初始化选课关联
     */
    private void initCourseStudents() {
        if (courseStudentMapper.selectCount(new LambdaQueryWrapper<CourseStudent>()
                .eq(CourseStudent::getCourseId, courseId)) == 0) {
            courseStudentMapper.insert(buildCourseStudent(courseId, student1Id, "2024级1班"));
            courseStudentMapper.insert(buildCourseStudent(courseId, student2Id, "2024级1班"));
            log.info("为课程 ID={} 添加选课学生", courseId);
        }
    }

    private CourseStudent buildCourseStudent(Long courseId, Long studentId, String className) {
        CourseStudent cs = new CourseStudent();
        cs.setCourseId(courseId);
        cs.setStudentId(studentId);
        cs.setClassName(className);
        cs.setSemester("2025-2026-1");
        return cs;
    }

    /**
     * 初始化考核及成绩记录
     */
    private void initAssessments() {
        if (assessmentMapper.selectCount(new LambdaQueryWrapper<Assessment>()
                .eq(Assessment::getCourseId, courseId)) > 0) return;

        String[][] assessmentsData = {
                {"作业1", "HOMEWORK", "100", "5", "2025-09-15"},
                {"期中考试", "EXAM", "100", "20", "2025-11-15"},
                {"期末考试", "EXAM", "100", "25", "2026-01-10"},
        };

        for (String[] a : assessmentsData) {
            Assessment assessment = new Assessment();
            assessment.setCourseId(courseId);
            assessment.setAssessmentName(a[0]);
            assessment.setAssessmentType(a[1]);
            assessment.setTotalScore(new BigDecimal(a[2]));
            assessment.setQuestionCount(Integer.parseInt(a[3]));
            assessment.setAssessmentDate(LocalDate.parse(a[4]));
            assessment.setSemester("2025-2026-1");
            assessment.setStatus("PUBLISHED");
            assessmentMapper.insert(assessment);

            for (int s = 0; s < 2; s++) {
                AssessmentRecord record = new AssessmentRecord();
                record.setAssessmentId(assessment.getId());
                record.setStudentId(s == 0 ? student1Id : student2Id);
                int baseScore = 75 + random.nextInt(20);
                record.setTotalScore(new BigDecimal(baseScore));
                record.setSubmitStatus("ON_TIME");
                record.setSubmitTime(LocalDate.parse(a[4]).atTime(14, 0));
                assessmentRecordMapper.insert(record);
            }
        }
        log.info("为课程 ID={} 创建考核数据", courseId);
    }

    /**
     * 初始化考勤记录
     */
    private void initAttendance() {
        if (attendanceMapper.selectCount(new LambdaQueryWrapper<Attendance>()
                .eq(Attendance::getCourseId, courseId)) > 0) return;

        LocalDate startDate = LocalDate.of(2025, 9, 1);

        for (int week = 0; week < 4; week++) { // 4周即可，减少初始化时间
            LocalDate date = startDate.plusWeeks(week);
            for (Long studentId : new Long[]{student1Id, student2Id}) {
                Attendance att = new Attendance();
                att.setCourseId(courseId);
                att.setStudentId(studentId);
                att.setAttendanceDate(date);
                // 故意让考勤率低一点
                att.setStatus(random.nextInt(10) < 7 ? "出勤" : "缺勤");
                att.setWeekNo(week + 1);
                att.setSemester("2025-2026-1");
                attendanceMapper.insert(att);
            }
        }
        log.info("为课程 ID={} 创建考勤记录", courseId);
    }

    /**
     * 初始化实验报告
     */
    private void initExperiments() {
        if (experimentMapper.selectCount(new LambdaQueryWrapper<Experiment>()
                .eq(Experiment::getCourseId, courseId)) > 0) {
            log.debug("实验数据已存在，跳过初始化");
            return;
        }
        String[][] experiments = {
                {"实验1：网络协议分析", "1", "92", "2025-09-28"},
                {"实验2：TCP连接与抓包", "2", "88", "2025-10-26"},
                {"实验3：路由与子网划分", "3", "90", "2025-11-30"},
                {"实验4：综合组网实验", "4", "85", "2025-12-20"},
        };

        int[][] expScores = {
                {92, 88, 90, 85},
                {88, 90, 82, 80},
        };

        for (int i = 0; i < experiments.length; i++) {
            String[] e = experiments[i];
            for (int s = 0; s < 2; s++) {
                Experiment exp = new Experiment();
                exp.setCourseId(courseId);
                exp.setStudentId(s == 0 ? student1Id : student2Id);
                exp.setExperimentName(e[0]);
                exp.setExperimentNo(Integer.parseInt(e[1]));
                exp.setScore(new BigDecimal(expScores[s][i]));
                exp.setSubmitTime(LocalDate.parse(e[3]).atTime(16, 0));
                exp.setSemester("2025-2026-1");
                experimentMapper.insert(exp);
            }
        }
        log.info("创建实验报告: {} 个实验 × 2名学生", experiments.length);
    }

    /**
     * 初始化知识点掌握度
     */
    private void initKnowledgeMastery() {
        if (studentKpMasteryMapper.selectCount(new LambdaQueryWrapper<StudentKpMastery>()
                .eq(StudentKpMastery::getCourseId, courseId)) > 0) return;

        // 计算机网络知识点
        String[] nwKps = {"OSI七层模型", "TCP/IP协议", "HTTP/HTTPS", "路由算法", "拥塞控制"};

        for (String kpName : nwKps) {
            for (int s = 0; s < 2; s++) {
                StudentKpMastery kp = new StudentKpMastery();
                kp.setStudentId(s == 0 ? student1Id : student2Id);
                kp.setCourseId(courseId);
                kp.setKpName(kpName);
                kp.setMasteryRate(new BigDecimal(70 + random.nextInt(25)));
                kp.setClassAvgRate(new BigDecimal(75 + random.nextInt(10)));
                studentKpMasteryMapper.insert(kp);
            }
        }
        log.info("为课程 ID={} 创建知识点掌握度数据", courseId);
    }

    /**
     * 初始化题库数据
     */
    private void initQuestionBank() {
        if (questionBankMapper.selectCount(new LambdaQueryWrapper<QuestionBank>()
                .eq(QuestionBank::getCourseId, courseId)) > 0) return;

        // 创建10道题目
        String[] questionTypes = {"SINGLE", "MULTI", "FILL", "SHORT"};
        String[] difficulties = {"EASY", "MEDIUM", "HARD"};

        for (int i = 0; i < 10; i++) {
            QuestionBank question = new QuestionBank();
            question.setCourseId(courseId);
            question.setTeacherId(teacher1Id);
            question.setQuestionType(questionTypes[i % questionTypes.length]);
            question.setDifficulty(difficulties[i % difficulties.length]);

            String content = String.format("{\"stem\":\"计算机网络课程第%d题\",\"options\":[\"选项A\",\"选项B\",\"选项C\",\"选项D\"],\"answer\":\"A\",\"analysis\":\"这是解析\"}",
                    i + 1);
            question.setContent(content);
            question.setKnowledgePoints("知识点" + (i + 1));
            question.setAiGenerated(0);
            question.setQualityClarity(4);
            question.setQualityDifficulty(4);
            question.setQualityAmbiguity(5);
            question.setQualityKpCoverage(4);
            question.setSocraticMode(0);
            question.setUsageCount(0);
            question.setStatus("PUBLISHED");

            questionBankMapper.insert(question);
        }
        log.info("为课程 ID={} 创建题库数据", courseId);
    }

    /**
     * 初始化试卷数据
     */
    private void initExamPapers() {
        if (examPaperMapper.selectCount(new LambdaQueryWrapper<ExamPaper>()
                .eq(ExamPaper::getCourseId, courseId)) > 0) return;

        // 创建2份试卷
        for (int i = 0; i < 2; i++) {
            ExamPaper paper = new ExamPaper();
            paper.setCourseId(courseId);
            paper.setTeacherId(teacher1Id);
            paper.setPaperName(String.format("计算机网络课程测试%d", i + 1));
            paper.setTotalScore(new BigDecimal(100));
            paper.setDurationMinutes(90);
            paper.setStartTime(LocalDateTime.now().plusDays(7 + i));
            paper.setEndTime(LocalDateTime.now().plusDays(8 + i));
            paper.setTargetClasses("1,2");
            paper.setTargetStudents("1,2");
            paper.setStatus("PUBLISHED");

            examPaperMapper.insert(paper);
        }
        log.info("为课程 ID={} 创建试卷数据", courseId);
    }
}
