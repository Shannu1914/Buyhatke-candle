document.addEventListener("DOMContentLoaded", () => {
  // Flash message auto-dismiss
  const flashMessages = document.querySelectorAll('.flash-message');
  flashMessages.forEach(msg => {
    setTimeout(() => {
      msg.style.display = 'none';
    }, 5000); // 5 seconds
  });

  // Mobile menu toggle
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("show");
    });
  }

  // Preview filename in upload forms
  const fileInputs = document.querySelectorAll('input[type="file"]');
  fileInputs.forEach(input => {
    input.addEventListener('change', function () {
      const label = this.nextElementSibling;
      if (this.files.length > 0) {
        label.innerText = this.files[0].name;
      }
    });
  });

  // Toggle password visibility
  const togglePassword = document.querySelectorAll('.toggle-password');
  togglePassword.forEach(button => {
    button.addEventListener('click', () => {
      const input = button.previousElementSibling;
      input.type = input.type === 'password' ? 'text' : 'password';
    });
  });
});
