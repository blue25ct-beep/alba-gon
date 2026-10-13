const { execSync } = require('child_process');
const fs = require('fs');

function findGit() {
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) return null;
  const ghDesktopPath = localAppData + '\\\\GitHubDesktop';
  if (!fs.existsSync(ghDesktopPath)) return null;
  
  const apps = fs.readdirSync(ghDesktopPath).filter(d => d.startsWith('app-')).sort().reverse();
  for (const app of apps) {
    const gitPath = ghDesktopPath + '\\\\' + app + '\\\\resources\\\\app\\\\git\\\\cmd\\\\git.exe';
    if (fs.existsSync(gitPath)) {
      return gitPath;
    }
  }
  return null;
}

const gitExe = findGit();
if (gitExe) {
  try {
    const status = execSync('"' + gitExe + '" status', { cwd: 'C:/Users/김진곤/Downloads/alba-gon' }).toString();
    console.log(status);
  } catch(e) {
    console.log('Error', e.message);
  }
}
