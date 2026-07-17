#!/bin/bash
# =============================================================================
# AITAES 数据导入全量测试脚本 (curl + MySQL 验证)
#
# 用法:
#   1. 确保后端在 localhost:8080 运行，MySQL/Redis 可用
#   2. bash test-data/test_import_all.sh
#
# 测试覆盖 9 种 importType，按依赖顺序执行，每步验证数据库写入。
# =============================================================================

set -e

BASE="http://localhost:8080"
API="$BASE/api"
EXCEL_DIR="test-data/excel"
MYSQL="mysql -uroot -p1234 aitaes_db"
PASS=0
FAIL=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_pass() { echo -e "${GREEN}[PASS]${NC} $1"; PASS=$((PASS+1)); }
log_fail() { echo -e "${RED}[FAIL]${NC} $1"; FAIL=$((FAIL+1)); }
log_info() { echo -e "${YELLOW}[INFO]${NC} $1"; }

# ── 登录获取 JWT token ────────────────────────────────────────
log_info "登录 T001 ..."
LOGIN_RESP=$(curl -s -X POST "$API/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"T001","password":"123456"}')
LOGIN_CODE=$(echo "$LOGIN_RESP" | grep -o '"code":[0-9]*' | head -1 | sed 's/"code"://')
TOKEN=$(echo "$LOGIN_RESP" | grep -o '"token":"[^"]*"' | head -1 | sed 's/"token":"//;s/"//')
if [ "$LOGIN_CODE" = "200" ] && [ -n "$TOKEN" ]; then
    log_pass "登录成功 (T001/123456), token=${TOKEN:0:20}..."
else
    log_fail "登录失败: $LOGIN_RESP"
    exit 1
fi

# 导入一个文件，返回 JSON 中的 status/rows 信息
do_import() {
    local file="$1"
    local import_type="$2"
    shift 2
    # 剩余参数作为额外的 form 字段 (courseId=, assessmentName=, assessmentType=)
    local extra_fields=()
    while [[ $# -gt 0 ]]; do
        extra_fields+=(-F "$1")
        shift
    done

    local resp
    resp=$(curl -s -H "Authorization: Bearer $TOKEN" --max-time 30 -X POST "$API/import/upload" \
        -F "file=@$EXCEL_DIR/$file" \
        -F "importType=$import_type" \
        "${extra_fields[@]}")

    echo "$resp"
}

# 提取 JSON 字段 (grep 匹配嵌套字段值)
json_field() {
    echo "$1" | grep -o "\"$2\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | head -1 | sed 's/.*":"//;s/"//' | tr -d ' '
    # 回退：尝试匹配非字符串值 (数字/true/false)
    if [ -z "$(echo "$1" | grep -o "\"$2\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | head -1)" ]; then
        echo "$1" | grep -o "\"$2\"[[:space:]]*:[[:space:]]*[0-9a-zA-Z]*" | head -1 | sed 's/.*://' | tr -d ' '
    fi
}

# 检查 JSON 中是否包含某段文本
json_contains() {
    echo "$1" | grep -q "$2" && echo "yes" || echo "no"
}

# =============================================================================
# Step 0: 清理旧测试数据（仅删本次测试会写入的数据，保留种子数据）
# =============================================================================
log_info "清理旧测试数据..."
$MYSQL -e "DELETE FROM t_record_kp_deduction WHERE record_id IN (SELECT id FROM t_assessment_record WHERE assessment_id IN (SELECT id FROM t_assessment WHERE course_id IN (1,2,7)));" 2>/dev/null || true
$MYSQL -e "DELETE FROM t_assessment_record WHERE assessment_id IN (SELECT id FROM t_assessment WHERE course_id IN (1,2,7));" 2>/dev/null || true
$MYSQL -e "DELETE FROM t_assessment WHERE course_id IN (1,2,7);" 2>/dev/null || true
$MYSQL -e "DELETE FROM t_attendance WHERE course_id IN (1,2,7);" 2>/dev/null || true
$MYSQL -e "DELETE FROM t_experiment WHERE course_id IN (1,2,7);" 2>/dev/null || true
$MYSQL -e "DELETE FROM t_course_student WHERE course_id IN (1,2,7);" 2>/dev/null || true
$MYSQL -e "DELETE FROM t_student WHERE student_no BETWEEN 'S2024001' AND 'S2025103';" 2>/dev/null || true
$MYSQL -e "DELETE FROM t_user WHERE username BETWEEN 'S2024001' AND 'S2025103';" 2>/dev/null || true
$MYSQL -e "DELETE FROM t_course WHERE course_no IN ('CS401','CS402','CS403');" 2>/dev/null || true
$MYSQL -e "DELETE FROM t_teacher WHERE teacher_no IN ('T101','T102','T103','T104','T105');" 2>/dev/null || true
$MYSQL -e "DELETE FROM t_user WHERE username IN ('T101','T102','T103','T104','T105');" 2>/dev/null || true
$MYSQL -e "DELETE FROM t_course_student WHERE course_id=7;" 2>/dev/null || true
log_info "清理完成"

# =============================================================================
# Step 1: TEACHER
# =============================================================================
log_info "=== Step 1: 导入教师 (TEACHER) ==="
RESP=$(do_import "teacher.xlsx" "TEACHER")
STATUS=$(json_field "$RESP" "status")
SUCCESS=$(json_field "$RESP" "successRows")
echo "  status=$STATUS successRows=$SUCCESS"
# 验证
DB_COUNT=$($MYSQL -N -e "SELECT COUNT(*) FROM t_teacher WHERE teacher_no IN ('T101','T102','T103','T104','T105');" 2>/dev/null)
if [ "$STATUS" = "SUCCESS" ] && [ "$SUCCESS" -ge 5 ] && [ "$DB_COUNT" -ge 5 ]; then
    log_pass "TEACHER: 5 条教师全部入库"
else
    log_fail "TEACHER: 预期 SUCCESS 5，实际 status=$STATUS success=$SUCCESS db_count=$DB_COUNT"
    echo "  RESP: $RESP"
fi

# =============================================================================
# Step 2: STUDENT
# =============================================================================
log_info "=== Step 2: 导入学生 (STUDENT) ==="
RESP=$(do_import "student.xlsx" "STUDENT")
STATUS=$(json_field "$RESP" "status")
SUCCESS=$(json_field "$RESP" "successRows")
SKIPPED=$(json_field "$RESP" "skippedRows")
echo "  status=$STATUS successRows=$SUCCESS skippedRows=$SKIPPED"
# 13 行新数据（S2024001-S2024004 可能已存在 → skip，S2025001-S2025103 9 个 + 前4个 = 13行）
# 实际：文件有 14 行，去重后应有 13 success + 可能有 skip
if [ "$SUCCESS" -ge 9 ]; then
    log_pass "STUDENT: 导入成功 (success=$SUCCESS)"
else
    log_fail "STUDENT: success=$SUCCESS 少于预期"
    echo "  RESP: $RESP"
fi

# =============================================================================
# Step 3: COURSE
# =============================================================================
log_info "=== Step 3: 导入课程 (COURSE) ==="
RESP=$(do_import "course.xlsx" "COURSE")
STATUS=$(json_field "$RESP" "status")
SUCCESS=$(json_field "$RESP" "successRows")
echo "  status=$STATUS successRows=$SUCCESS"
DB_COUNT=$($MYSQL -N -e "SELECT COUNT(*) FROM t_course WHERE course_no IN ('CS401','CS402','CS403');" 2>/dev/null)
if [ "$SUCCESS" -ge 3 ] && [ "$DB_COUNT" -ge 3 ]; then
    log_pass "COURSE: 3 门课程全部入库"
else
    log_fail "COURSE: 预期 3，实际 success=$SUCCESS db_count=$DB_COUNT"
    echo "  RESP: $RESP"
fi

# =============================================================================
# Step 4: CLASS_STUDENT (需要 courseId=7，即 CS101)
# =============================================================================
log_info "=== Step 4: 导入班级学生名单 (CLASS_STUDENT, courseId=7) ==="
RESP=$(do_import "CS101_CLASS_STUDENT_软件2101.xlsx" "CLASS_STUDENT" \
    "courseId=7")
STATUS=$(json_field "$RESP" "status")
SUCCESS=$(json_field "$RESP" "successRows")
echo "  status=$STATUS successRows=$SUCCESS"
DB_COUNT=$($MYSQL -N -e "SELECT COUNT(*) FROM t_course_student WHERE course_id=7;" 2>/dev/null)
if [ "$SUCCESS" -ge 10 ] && [ "$DB_COUNT" -ge 10 ]; then
    log_pass "CLASS_STUDENT: $SUCCESS 名学生关联课程 CS101"
else
    log_fail "CLASS_STUDENT: success=$SUCCESS db_course_student=$DB_COUNT"
    echo "  RESP: $RESP"
fi

# =============================================================================
# Step 5: ATTENDANCE (需要 courseId=7)
# =============================================================================
log_info "=== Step 5: 导入考勤 (ATTENDANCE, courseId=7) ==="
RESP=$(do_import "CS101_ATTENDANCE_第1周.xlsx" "ATTENDANCE" \
    "courseId=7")
STATUS=$(json_field "$RESP" "status")
SUCCESS=$(json_field "$RESP" "successRows")
echo "  status=$STATUS successRows=$SUCCESS"
DB_COUNT=$($MYSQL -N -e "SELECT COUNT(*) FROM t_attendance WHERE course_id=7;" 2>/dev/null)
if [ "$SUCCESS" -ge 10 ] && [ "$DB_COUNT" -ge 10 ]; then
    log_pass "ATTENDANCE: $SUCCESS 条考勤入库"
else
    log_fail "ATTENDANCE: success=$SUCCESS db_count=$DB_COUNT"
    echo "  RESP: $RESP"
fi

# =============================================================================
# Step 6: EXPERIMENT (需要 courseId=7)
# =============================================================================
log_info "=== Step 6: 导入实验报告 (EXPERIMENT, courseId=7) ==="
RESP=$(do_import "CS101_EXPERIMENT_实验一.xlsx" "EXPERIMENT" \
    "courseId=7")
STATUS=$(json_field "$RESP" "status")
SUCCESS=$(json_field "$RESP" "successRows")
echo "  status=$STATUS successRows=$SUCCESS"
DB_COUNT=$($MYSQL -N -e "SELECT COUNT(*) FROM t_experiment WHERE course_id=7;" 2>/dev/null)
if [ "$SUCCESS" -ge 10 ] && [ "$DB_COUNT" -ge 10 ]; then
    log_pass "EXPERIMENT: $SUCCESS 条实验记录入库"
else
    log_fail "EXPERIMENT: success=$SUCCESS db_count=$DB_COUNT"
    echo "  RESP: $RESP"
fi

# =============================================================================
# Step 7: HOMEWORK (需要 courseId=7 + assessmentName)
# =============================================================================
log_info "=== Step 7: 导入作业成绩 (HOMEWORK, courseId=7) ==="
RESP=$(do_import "CS101_HOMEWORK_第1次作业.xlsx" "HOMEWORK" \
    "courseId=7" "assessmentName=第1次作业")
STATUS=$(json_field "$RESP" "status")
SUCCESS=$(json_field "$RESP" "successRows")
echo "  status=$STATUS successRows=$SUCCESS"
ASSESS_COUNT=$($MYSQL -N -e "SELECT COUNT(*) FROM t_assessment WHERE course_id=7 AND assessment_type='HOMEWORK';" 2>/dev/null)
REC_COUNT=$($MYSQL -N -e "SELECT COUNT(*) FROM t_assessment_record WHERE assessment_id IN (SELECT id FROM t_assessment WHERE course_id=7 AND assessment_type='HOMEWORK');" 2>/dev/null)
if [ "$SUCCESS" -ge 10 ] && [ "$ASSESS_COUNT" -ge 1 ] && [ "$REC_COUNT" -ge 10 ]; then
    log_pass "HOMEWORK: 考核表 + $REC_COUNT 条成绩入库"
else
    log_fail "HOMEWORK: success=$SUCCESS assessments=$ASSESS_COUNT records=$REC_COUNT"
    echo "  RESP: $RESP"
fi

# =============================================================================
# Step 8: QUIZ (需要 courseId=7 + assessmentName)
# =============================================================================
log_info "=== Step 8: 导入测验成绩 (QUIZ, courseId=7) ==="
RESP=$(do_import "CS101_QUIZ_第1次测验.xlsx" "QUIZ" \
    "courseId=7" "assessmentName=第1次测验")
STATUS=$(json_field "$RESP" "status")
SUCCESS=$(json_field "$RESP" "successRows")
echo "  status=$STATUS successRows=$SUCCESS"
REC_COUNT=$($MYSQL -N -e "SELECT COUNT(*) FROM t_assessment_record WHERE assessment_id IN (SELECT id FROM t_assessment WHERE course_id=7 AND assessment_type='QUIZ');" 2>/dev/null)
if [ "$SUCCESS" -ge 10 ] && [ "$REC_COUNT" -ge 10 ]; then
    log_pass "QUIZ: $REC_COUNT 条成绩入库"
else
    log_fail "QUIZ: success=$SUCCESS records=$REC_COUNT"
    echo "  RESP: $RESP"
fi

# =============================================================================
# Step 9: EXAM_SCORE MIDTERM (需要 courseId=7 + assessmentName + assessmentType)
# =============================================================================
log_info "=== Step 9: 导入期中考试成绩 (EXAM_SCORE MIDTERM, courseId=7) ==="
RESP=$(do_import "CS101_EXAM_SCORE_MIDTERM_期中考试.xlsx" "EXAM_SCORE" \
    "courseId=7" "assessmentName=期中考试" "assessmentType=MIDTERM")
STATUS=$(json_field "$RESP" "status")
SUCCESS=$(json_field "$RESP" "successRows")
echo "  status=$STATUS successRows=$SUCCESS"
ASSESS_COUNT=$($MYSQL -N -e "SELECT COUNT(*) FROM t_assessment WHERE course_id=7 AND assessment_type='MIDTERM';" 2>/dev/null)
REC_COUNT=$($MYSQL -N -e "SELECT COUNT(*) FROM t_assessment_record WHERE assessment_id IN (SELECT id FROM t_assessment WHERE course_id=7 AND assessment_type='MIDTERM');" 2>/dev/null)
if [ "$SUCCESS" -ge 10 ] && [ "$ASSESS_COUNT" -ge 1 ] && [ "$REC_COUNT" -ge 10 ]; then
    log_pass "EXAM_SCORE MIDTERM: 考核表 + $REC_COUNT 条成绩入库"
else
    log_fail "EXAM_SCORE MIDTERM: success=$SUCCESS assessments=$ASSESS_COUNT records=$REC_COUNT"
    echo "  RESP: $RESP"
fi

# =============================================================================
# Bonus: 测试诚实失败场景
# =============================================================================
log_info "=== Bonus: 空文件 → FAILED ==="
python -c "
import openpyxl
wb = openpyxl.Workbook()
ws = wb.active
ws.append(['学号','姓名','性别','学院','专业','班级','年级','邮箱'])
wb.save('test-data/excel/_empty.xlsx')
" 2>/dev/null
RESP=$(do_import "_empty.xlsx" "STUDENT")
echo "  RESP: $RESP"
if echo "$RESP" | grep -q '"status":"FAILED"'; then
    log_pass "空文件: 正确返回 FAILED"
else
    log_fail "空文件: 预期 FAILED"
fi
rm -f test-data/excel/_empty.xlsx

log_info "=== Bonus: 不传 courseId 且文件名无课程编号 → FAILED ==="
python -c "
import openpyxl
wb = openpyxl.Workbook()
ws = wb.active
ws.append(['学号','姓名','日期','状态'])
ws.append(['S2024001','赵小明','2025-09-08','出勤'])
wb.save('test-data/excel/_no_course.xlsx')
" 2>/dev/null
RESP=$(do_import "_no_course.xlsx" "ATTENDANCE")
echo "  RESP: $RESP"
if echo "$RESP" | grep -q '"status":"FAILED"'; then
    log_pass "无课程归属: 正确返回 FAILED"
else
    log_fail "无课程归属: 预期 FAILED"
fi
rm -f test-data/excel/_no_course.xlsx

# =============================================================================
# 汇总
# =============================================================================
echo ""
echo "============================================"
echo -e "  测试结果: ${GREEN}通过 $PASS${NC} / ${RED}失败 $FAIL${NC}"
echo "============================================"

# 最终数据库快照
echo ""
log_info "=== 最终数据库状态 ==="
$MYSQL -e "
SELECT 't_user' tbl, COUNT(*) cnt FROM t_user WHERE username LIKE 'S2024%' OR username LIKE 'S2025%' OR username LIKE 'T10%'
UNION ALL SELECT 't_student', COUNT(*) FROM t_student WHERE student_no LIKE 'S2024%' OR student_no LIKE 'S2025%'
UNION ALL SELECT 't_teacher', COUNT(*) FROM t_teacher WHERE teacher_no LIKE 'T10%'
UNION ALL SELECT 't_course (CS4xx)', COUNT(*) FROM t_course WHERE course_no LIKE 'CS4%'
UNION ALL SELECT 't_course_student (c7)', COUNT(*) FROM t_course_student WHERE course_id=7
UNION ALL SELECT 't_attendance (c7)', COUNT(*) FROM t_attendance WHERE course_id=7
UNION ALL SELECT 't_experiment (c7)', COUNT(*) FROM t_experiment WHERE course_id=7
UNION ALL SELECT 't_assessment (c7)', COUNT(*) FROM t_assessment WHERE course_id=7
UNION ALL SELECT 't_assessment_record (c7)', COUNT(*) FROM t_assessment_record r JOIN t_assessment a ON a.id=r.assessment_id WHERE a.course_id=7;
" 2>/dev/null

rm -f test-data/excel/_empty.xlsx test-data/excel/_no_course.xlsx

exit $FAIL
