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
document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = {
        name: document.getElementById('name').value.trim(),
        contact: document.getElementById('contactMethod').value.trim(),
        message: document.getElementById('message').value.trim()
    };
    if (!formData.name) {
        console.warn('Не заполнено имя');
        alert('Введите ваше имя');
        return;
    }
    if (!formData.contact) {
        console.warn('Не заполнены контакты');
        alert('Введите email или телефон');
        return;
    }
    if (!formData.message) {
        console.warn('Не заполнено сообщение');
        alert('Введите ваше сообщение');
        return;
    }
    
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';
    try {
        
        const startTime = Date.now();
        const response = await fetch('https://dsm-94vn.onrender.com/api/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const endTime = Date.now();
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Сообщение отправлено!');
            
            document.getElementById('contactForm').reset();
            document.getElementById('privacyPolicy').checked = false;
            
        } else {
            console.error('Ошибка сервера:', data);
            alert(`Ошибка: ${data.error || 'Неизвестная ошибка сервера'}`);
        }
        
    } catch (error) {
        console.error('Критическая ошибка:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.error('Проблема с сетью или CORS');
            alert('Ошибка сети. Проверьте подключение к интернету.');
        } else {
            alert('Произошла непредвиденная ошибка');
        }
        
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});




