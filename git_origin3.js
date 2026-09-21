const { execSync } = require('child_process');
const fs = require('fs');

function findGit() {
  const ghDesktopPath = process.env.LOCALAPPDATA + '\\\\GitHubDesktop';
  const apps = fs.readdirSync(ghDesktopPath).filter(d => d.startsWith('app-')).sort().reverse();
  for (const app of apps) {
    const gitPath = ghDesktopPath + '\\\\' + app + '\\\\resources\\\\app\\\\git\\\\cmd\\\\git.exe';
    if (fs.existsSync(gitPath)) return gitPath;
  }
}
const gitExe = findGit();
console.log(execSync('"' + gitExe + '" log origin/master -n 3 --format="%h %ci %s"', { cwd: 'C:/Users/김진곤/Downloads/alba-gon' }).toString());
