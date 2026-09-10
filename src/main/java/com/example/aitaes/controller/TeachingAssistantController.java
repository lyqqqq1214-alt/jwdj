package com.example.aitaes.controller;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.annotation.RequireRole;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.common.Result;
import com.example.aitaes.dto.AssistantPermissionDTO;
import com.example.aitaes.dto.TeachingAssistantDTO;
import com.example.aitaes.entity.*;
import com.example.aitaes.mapper.*;
import com.example.aitaes.util.PasswordUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController @RequestMapping("/api/teaching-assistants") @RequiredArgsConstructor
@RequireRole({"TEACHER", "ADMIN"})
public class TeachingAssistantController {
 private final TeachingAssistantMapper assistantMapper; private final AssistantPermissionMapper permissionMapper; private final TeacherMapper teacherMapper; private final UserMapper userMapper; private final CourseMapper courseMapper;
 private Long teacherId(Long userId) { Teacher t=teacherMapper.selectOne(new LambdaQueryWrapper<Teacher>().eq(Teacher::getUserId,userId)); if(t==null) throw new BusinessException(403,"教师资料不存在"); return t.getId(); }
 @GetMapping public Result<List<Map<String,Object>>> list(@RequestAttribute("userId") Long userId,@RequestAttribute("role") String role){ LambdaQueryWrapper<TeachingAssistant> q=new LambdaQueryWrapper<>(); if(!"ADMIN".equals(role)) q.eq(TeachingAssistant::getTeacherId,teacherId(userId)); return Result.success(assistantMapper.selectList(q).stream().map(a->{User u=userMapper.selectById(a.getUserId()); Map<String,Object> m=new HashMap<>();m.put("id",a.getId());m.put("username",u==null?"":u.getUsername());m.put("name",a.getName());m.put("status",u==null?"DISABLED":u.getStatus());m.put("permissions",permissionMapper.selectList(new LambdaQueryWrapper<AssistantPermission>().eq(AssistantPermission::getAssistantId,a.getId())));return m;}).toList()); }
 @GetMapping("/me/permissions") @RequireRole("ASSISTANT") public Result<List<AssistantPermission>> myPermissions(@RequestAttribute("userId") Long userId){TeachingAssistant a=assistantMapper.selectOne(new LambdaQueryWrapper<TeachingAssistant>().eq(TeachingAssistant::getUserId,userId));if(a==null)throw new BusinessException(404,"助教资料不存在");return Result.success(permissionMapper.selectList(new LambdaQueryWrapper<AssistantPermission>().eq(AssistantPermission::getAssistantId,a.getId())));}
 @PostMapping @Transactional public Result<Void> create(@RequestAttribute("userId") Long userId,@Valid @RequestBody TeachingAssistantDTO dto){ if(userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername,dto.getUsername()))!=null)throw new BusinessException(400,"账号已存在"); User u=new User();u.setUsername(dto.getUsername());u.setPassword(PasswordUtil.encode(dto.getPassword()));u.setRole("ASSISTANT");u.setStatus("ACTIVE");u.setFirstLogin(1);userMapper.insert(u); TeachingAssistant a=new TeachingAssistant();a.setUserId(u.getId());a.setTeacherId(teacherId(userId));a.setName(dto.getName());assistantMapper.insert(a);return Result.success("助教创建成功",null); }
 @PutMapping("/{id}/status") public Result<Void> status(@PathVariable Long id,@RequestAttribute("userId") Long userId,@RequestBody Map<String,String> body){ TeachingAssistant a=assistantMapper.selectById(id);if(a==null||!a.getTeacherId().equals(teacherId(userId)))throw new BusinessException(403,"无权操作");User u=userMapper.selectById(a.getUserId());u.setStatus(body.get("status"));userMapper.updateById(u);return Result.success("状态已更新",null); }
 @DeleteMapping("/{id}") @Transactional public Result<Void> delete(@PathVariable Long id,@RequestAttribute("userId") Long userId){TeachingAssistant a=assistantMapper.selectById(id);if(a==null||!a.getTeacherId().equals(teacherId(userId)))throw new BusinessException(403,"无权操作");permissionMapper.delete(new LambdaQueryWrapper<AssistantPermission>().eq(AssistantPermission::getAssistantId,id));assistantMapper.deleteById(id);userMapper.deleteById(a.getUserId());return Result.success("助教已删除",null);}
 @PutMapping("/{id}/permissions") public Result<Void> permission(@PathVariable Long id,@RequestAttribute("userId") Long userId,@Valid @RequestBody AssistantPermissionDTO d){TeachingAssistant a=assistantMapper.selectById(id);if(a==null||!a.getTeacherId().equals(teacherId(userId)))throw new BusinessException(403,"无权操作");Course c=courseMapper.selectById(d.getCourseId());if(c==null||!c.getTeacherId().equals(a.getTeacherId()))throw new BusinessException(400,"课程不属于当前教师");AssistantPermission p=permissionMapper.selectOne(new LambdaQueryWrapper<AssistantPermission>().eq(AssistantPermission::getAssistantId,id).eq(AssistantPermission::getCourseId,d.getCourseId()));if(p==null){p=new AssistantPermission();p.setAssistantId(id);p.setCourseId(d.getCourseId());}p.setCanViewData(Boolean.TRUE.equals(d.getCanViewData())?1:0);p.setCanImportData(Boolean.TRUE.equals(d.getCanImportData())?1:0);p.setCanGrade(Boolean.TRUE.equals(d.getCanGrade())?1:0);p.setCanViewPortrait(Boolean.TRUE.equals(d.getCanViewPortrait())?1:0);if(p.getId()==null)permissionMapper.insert(p);else permissionMapper.updateById(p);return Result.success("权限已保存",null);}
}
