const files = document.querySelectorAll('.sidebar li');
const title = document.querySelector('.editor .panel-title');

files.forEach((file) => {
  file.addEventListener('click', () => {
    files.forEach((node) => node.classList.remove('active'));
    file.classList.add('active');
    title.textContent = file.textContent;
  });
});
