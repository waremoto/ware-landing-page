/* -- Glow effect -- */

const blob = document.getElementById("blob");

window.onpointermove = event => { 
  const { clientX, clientY } = event;
  
  blob.animate({
    left: `${clientX}px`,
    top: `${clientY}px`
  }, { duration: 3000, fill: "forwards" });
}

/* -- Text effect -- */

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const screen = document.querySelector(".screen"),
      name = document.querySelector(".name");
const originalName = name.innerText;

let interval = (futureName) => {
  let iteration = 0;
  return setInterval(() => {
    name.innerText = name.innerText
      .split("")
      .map((letter, index) => {
        if(index < iteration) {
          return futureName[index];
        }
      
        return letters[Math.floor(Math.random() * 26)]
      })
      .join("");
    
    if(iteration >= futureName.length){ 
      clearInterval(interval);
    }
    
    iteration += 1 / 3;
  }, 13)
};

let currentInterval = null;
screen.onmouseleave = event => {
  if (currentInterval != null)
   clearInterval(currentInterval);
  //name.innerText = originalName;
  currentInterval = interval(originalName);
}
screen.onmouseenter = event => {  
  if (currentInterval != null)
   clearInterval(currentInterval);
  currentInterval = interval(name.dataset.value);
}