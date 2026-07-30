(function(){
  var targets = document.querySelectorAll('.fade-in');
  if(!('IntersectionObserver' in window) || targets.length === 0){
    targets.forEach(function(el){ el.classList.add('visible'); });
    return;
  }
  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  targets.forEach(function(el){ observer.observe(el); });
})();
