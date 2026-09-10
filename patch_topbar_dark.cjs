const fs = require('fs');
let file = 'src/components/layout/Topbar.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const \[isDarkMode, setIsDarkMode\] = useState\(false\);/,
  `const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
           (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);`
);

content = content.replace(
  `setIsDarkMode(!isDarkMode);\n    // In a real app this would sync with a theme provider`,
  `setIsDarkMode(!isDarkMode);`
);

fs.writeFileSync(file, content);
console.log("Patched Topbar.tsx");
