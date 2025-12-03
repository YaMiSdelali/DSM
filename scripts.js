//Фронтчасть
// Аккордеон для программ подготовки
document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
        const content = header.nextElementSibling;
        const isActive = content.classList.contains('active');
        
        // Переключаем состояние текущего элемента
        if (isActive) {
            content.classList.remove('active');
            header.querySelector('span:last-child').textContent = '+';
        } else {
            content.classList.add('active');
            header.querySelector('span:last-child').textContent = '-';
        }
    });
});

// Переключение темы
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('img');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    if (document.body.classList.contains('dark-theme')) {
        themeIcon.src = 'moon.svg';
    } else {
        themeIcon.src = 'sun.svg'; 
    }
});

// Активация кнопки отправки формы
const privacyCheckbox = document.getElementById('privacyPolicy');
const submitBtn = document.getElementById('submitBtn');

privacyCheckbox.addEventListener('change', () => {
    submitBtn.disabled = !privacyCheckbox.checked;
});

// Обработка отправки формы
document.getElementById('contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Форма отправлена!');
    fetch('https://kgeu-backend.onrender.com/api/message',
        {method: 'POST',
        headers: {'Content-Type':  'application/json'},
        body: JSON.stringify({
            name: document.getElementById('name').value,
            contact: document.getElementById('contactMethod').value,
            message: document.getElementById('message').value
        })
        }
    )

});
