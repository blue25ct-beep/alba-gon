const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/PhotoCaptureModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldFileChange = `      };
      reader.readAsDataURL(file);
    });
  };`;

const newFileChange = `      };
      reader.readAsDataURL(file);
    });
    // iOS 등에서 같은 파일을 다시 선택하거나 연속 촬영할 때 onChange가 안 먹히는 버그 방지
    e.target.value = '';
  };`;

content = content.replace(oldFileChange, newFileChange);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed iOS photo file input reset');
