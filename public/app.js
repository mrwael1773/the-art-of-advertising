document.addEventListener("DOMContentLoaded",()=>{
  const panel=document.querySelector("#account-panel");
  if(panel) panel.hidden=false;
  const name=document.querySelector("#account-name");
  if(name) name.textContent="متعلم";
});
