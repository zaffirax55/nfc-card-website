// Restore only the visual theme before stylesheets are parsed to prevent white flashes.
(()=>{
 try {
  const data=JSON.parse(localStorage.getItem('nfc-card-ui-preferences-v1')||'{}');
  const theme=data.theme==='dark'||data.theme==='light'?data.theme:
   (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  document.documentElement.dataset.theme=theme;
 } catch {
  document.documentElement.dataset.theme='light';
 }
})();
