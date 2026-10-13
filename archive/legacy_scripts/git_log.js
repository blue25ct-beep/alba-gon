const { execSync } = require('child_process');
try {
  const log = execSync('"C:\\Program Files\\Git\\cmd\\git.exe" log -n 5 --oneline', { cwd: 'C:/Users/김진곤/Downloads/alba-gon' }).toString();
  console.log(log);
} catch (e) {
  console.log('Error:', e.message);
}
