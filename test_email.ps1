$SMTPServer = "smtp.gmail.com"
$SMTPPort = 587
$Username = "blizzencreations@gmail.com"
$Password = "lzbngeimmroazvou"
$SecurePassword = ConvertTo-SecureString $Password -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($Username, $SecurePassword)

try {
    Send-MailMessage -From $Username -To $Username -Subject "Test from LMS" -Body "This is a test email to verify SMTP settings." -SmtpServer $SMTPServer -Port $SMTPPort -Credential $Credential -UseSsl -ErrorAction Stop
    Write-Host "Email sent successfully"
} catch {
    Write-Host "Failed to send email: $_"
}
