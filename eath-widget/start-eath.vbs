' คลิกเดียวเปิดน้องเอิธ widget (ไม่มีหน้าต่าง console)
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
sh.CurrentDirectory = dir
electron = dir & "\node_modules\electron\dist\electron.exe"
If fso.FileExists(electron) Then
  sh.Run """" & electron & """ """ & dir & """", 0, False
Else
  MsgBox "ยังไม่ได้ติดตั้ง Electron" & vbCrLf & "เปิด PowerShell ในโฟลเดอร์นี้แล้วรัน: npm install", 48, "เอิธ widget"
End If
