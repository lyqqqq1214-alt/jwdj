from docx import Document
from docx.shared import Cm, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from pathlib import Path

OUT = Path(r"D:\jwdj\reports\小组会议记录-4.1_张卓南.docx")
OUT.parent.mkdir(parents=True, exist_ok=True)

def font(run, name='宋体', size=10.5, bold=False):
    run.font.name = name
    run._element.rPr.rFonts.set(qn('w:eastAsia'), name)
    run.font.size = Pt(size)
    run.bold = bold

def set_border(table):
    pr = table._tbl.tblPr
    borders = OxmlElement('w:tblBorders')
    for edge in ('top','left','bottom','right','insideH','insideV'):
        el = OxmlElement(f'w:{edge}')
        el.set(qn('w:val'),'single'); el.set(qn('w:sz'),'6'); el.set(qn('w:color'),'808080')
        borders.append(el)
    pr.append(borders)

def repeat_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    marker = OxmlElement('w:tblHeader')
    marker.set(qn('w:val'), 'true')
    tr_pr.append(marker)

def shade(cell, value='EDEDED'):
    pr = cell._tc.get_or_add_tcPr(); e = OxmlElement('w:shd'); e.set(qn('w:fill'),value); pr.append(e)

def cell_text(cell, text, bold=False, align=WD_ALIGN_PARAGRAPH.LEFT):
    cell.text = ''
    p = cell.paragraphs[0]; p.alignment = align; p.paragraph_format.space_after = Pt(0); p.paragraph_format.line_spacing = 1.12
    r = p.add_run(text); font(r, size=10, bold=bold)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    pr = cell._tc.get_or_add_tcPr(); mar = OxmlElement('w:tcMar')
    for k in ('top','start','bottom','end'):
        e=OxmlElement(f'w:{k}'); e.set(qn('w:w'),'110'); e.set(qn('w:type'),'dxa'); mar.append(e)
    pr.append(mar)

def add_heading(doc, text):
    p=doc.add_paragraph(); p.paragraph_format.space_before=Pt(6); p.paragraph_format.space_after=Pt(4); p.paragraph_format.line_spacing=1.25
    r=p.add_run(text); font(r, size=12, bold=True)
    return p

def add_body(doc, text):
    p=doc.add_paragraph(); p.paragraph_format.first_line_indent=Cm(0.74); p.paragraph_format.space_after=Pt(5); p.paragraph_format.line_spacing=1.28
    r=p.add_run(text); font(r, size=10.5)
    return p

doc=Document()
sec=doc.sections[0]
sec.top_margin=Cm(1.65); sec.bottom_margin=Cm(1.65); sec.left_margin=Cm(2.0); sec.right_margin=Cm(2.0)
style=doc.styles['Normal']; style.font.name='宋体'; style._element.rPr.rFonts.set(qn('w:eastAsia'),'宋体'); style.font.size=Pt(10.5)

p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_after=Pt(4)
r=p.add_run('《操作系统课程设计》会议记录'); font(r, name='黑体', size=17, bold=True)
p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_after=Pt(10)
r=p.add_run('Meeting Record 4.1'); font(r, name='Times New Roman', size=12, bold=True)

meta=doc.add_table(rows=4, cols=4); meta.alignment=WD_TABLE_ALIGNMENT.CENTER; meta.autofit=False; set_border(meta)
meta_data=[
    ('小组名称','酱味大鸡组','指导老师','周军海'),
    ('主持人','李瑜清','开始时间','9.7 18:30'),
    ('会议参加人员','李瑜清 赵文琪 张卓南 阿米娜·赛力克','结束时间','9.7 19:45'),
    ('会议记录人员','张卓南（202326010410 软件工程2304班）','记录日期','9.8'),
]
for row, vals in zip(meta.rows,meta_data):
    for i,(cell,val) in enumerate(zip(row.cells,vals)):
        cell_text(cell,val,bold=i in (0,2),align=WD_ALIGN_PARAGRAPH.CENTER if i in (0,2) else WD_ALIGN_PARAGRAPH.LEFT)
        if i in (0,2): shade(cell)

doc.add_paragraph().paragraph_format.space_after=Pt(1)
topic=doc.add_table(rows=1,cols=2); topic.alignment=WD_TABLE_ALIGNMENT.CENTER; set_border(topic)
cell_text(topic.cell(0,0),'会议主题',bold=True,align=WD_ALIGN_PARAGRAPH.CENTER); shade(topic.cell(0,0))
cell_text(topic.cell(0,1),'第四周收官冲刺计划确认、任务分工与答辩准备')

add_heading(doc,'会议内容：')
add_heading(doc,'（一）第三周工作回顾与项目状态确认')
add_body(doc,'会议首先回顾了第三周工作完成情况。在线考试、错题分析与相似题推荐、AI对话助手、通知中心等模块已完成主要功能开发与联调，系统已能够演示从数据导入、智能分析、在线考试到错题练习的基本流程。全体成员确认，第三周的重点由“功能补全与系统集成”转向“AI主动分析、部署上线和答辩稳定性”。')
add_body(doc,'会议同时梳理了当前需要继续关注的问题：一是AI功能仍以被动问答和单次出题为主，需增强基于教学数据的主动分析能力；二是题库知识点与难度标签尚需统一，避免分析结果缺乏可靠的数据基础；三是系统仍主要在开发环境运行，答辩电脑上的部署、数据库初始化和本地大模型服务必须在本周完成验证。')

add_heading(doc,'（二）第四周功能范围与任务分工确认')
add_body(doc,'经讨论，本周定位为项目收官冲刺阶段，核心目标是将AI能力从“被动问答”升级为“主动分析”，并完成系统部署、全流程回归测试和答辩准备。会议确认本周八项工作如下：')

tasks=doc.add_table(rows=1,cols=3); tasks.alignment=WD_TABLE_ALIGNMENT.CENTER; tasks.autofit=False; set_border(tasks)
headers=['任务','负责人','截止时间']
for i,x in enumerate(headers): cell_text(tasks.cell(0,i),x,bold=True,align=WD_ALIGN_PARAGRAPH.CENTER); shade(tasks.cell(0,i),'D9EAF7')
repeat_header(tasks.rows[0])
task_rows=[
('AI智能分析引擎：完成成绩、作业、考勤多源数据聚合，输出知识点短板、学生预警、到课率关联分析及AI教学建议。','李瑜清','9月10日自测通过'),
('AI智能分析报告页面：新增教师端AI分析入口，展示知识点短板、学生预警、到课率、教学建议等卡片和图表。','阿米娜','9月11日完成交互优化'),
('题目知识点与难度双维标注：整理现有题库，补齐知识点和难度标签；改造AI出题接口输出标签，并支持题库标签编辑。','张卓南','9月10日完成'),
('AI对话助手降级：保留教师端基本问答，取消学生端气泡；完成教师端大模型对话接口与前端联调。','张卓南、阿米娜','9月10日可用'),
('评价反馈子模块：在教师评价页面集成维度雷达图、评语摘要和AI改进建议。','阿米娜、赵文琪','9月11日联调通过'),
('系统部署上线：完成前端部署、后端Jar运行、数据库初始化和本地Ollama服务配置。','赵文琪、张卓南','9月12日全链路验证'),
('全流程回归测试与Bug修复：覆盖十个模块，修复高优先级问题并进行最终演示预演。','全体成员','9月12日预演'),
('文档更新与答辩准备：更新需求、API、测试、部署文档，完善答辩脚本及演示数据。','李瑜清','9月12日完成'),
]
for row in task_rows:
    cells=tasks.add_row().cells
    for i,val in enumerate(row): cell_text(cells[i],val,align=WD_ALIGN_PARAGRAPH.CENTER if i in (1,2) else WD_ALIGN_PARAGRAPH.LEFT)

add_heading(doc,'（三）张卓南个人任务与协作安排')
add_body(doc,'张卓南负责题目知识点与难度双维标注、AI出题接口标签输出改造、题库标签编辑支持，以及教师端AI对话助手的后端联调工作。题库标签整理需优先完成，以保证AI智能分析引擎能够按照知识点正确聚合数据。部署阶段，张卓南将与赵文琪共同完成本地Ollama服务配置、连通性验证和答辩环境全链路检查。')
add_body(doc,'在协作安排上，张卓南需向李瑜清提供标签数据结构和题库数据验证结果，配合AI智能分析引擎的知识点短板统计；向阿米娜提供稳定的AI对话接口和标签字段说明，避免前端联调等待。每日18:30在开发群同步进度，出现数据库、模型服务或接口阻塞时当天提出。')

add_heading(doc,'（四）风险、验收标准与里程碑确认')
add_body(doc,'会议明确，题库标签整理是AI分析准确性的基础。若标签质量不足，知识点短板分析和教学建议将缺乏依据，因此须采用“一级模块 + 二级知识点 + 难度”结构，并对导入后的标签进行抽样核验。AI对话助手本周按降级方案推进，只保障教师端基本问答稳定可用，苏格拉底追问模式不作为本周验收硬性要求。')
add_body(doc,'部署方面，前端、后端、MySQL和Ollama必须在答辩用电脑或目标环境中独立运行，不能依赖开发机临时配置。验收时须通过浏览器完整演示数据导入、AI分析、考试、错题练习、评价反馈等核心流程。9月11日完成主要功能测试和部署验证，9月12日按正式答辩流程进行最终预演。')

doc.add_page_break()
add_heading(doc,'已解决问题：')
for t in [
'第四周工作范围已统一确认。团队将有限开发精力集中于AI智能分析引擎、题库标签、部署上线和答辩稳定性，AI对话助手调整为教师端辅助功能。',
'任务分工与时间节点已明确。张卓南负责题库双维标注、AI出题标签改造、教师端对话联调及本地模型部署协作，相关工作分别以9月10日和9月12日为关键节点。',
'验收标准已确定。AI分析需能输出知识点短板、学生预警、到课率关联和教学建议；部署后系统须在浏览器中完成全流程演示，并在9月12日前完成最终预演。']:
    add_body(doc,t)

add_heading(doc,'待讨论问题：')
for t in [
'题库中知识点标签的细粒度需在整理过程中进一步统一。对于跨模块题目，是否允许绑定多个二级知识点及其权重，需要结合AI分析结果再确认。',
'学生预警阈值和教学建议Prompt的具体参数需在完成数据聚合后使用演示数据验证，必要时由李瑜清组织调整。',
'答辩部署环境的网络权限、MySQL账号和Ollama模型文件容量需提前核对；若硬件资源不足，应准备模型降级或本地离线演示方案。']:
    add_body(doc,t)

doc.save(OUT)
print(OUT)
