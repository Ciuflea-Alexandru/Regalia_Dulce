function chooseFile() {
    document.getElementById("profile-picture-input").click();
}

function submitForm() {
    document.getElementById("profile-picture-form").submit();
}

function cancelChangePassword() {
    document.getElementById("change-password-form").reset();

    document.getElementById("change-password-container").style.display = "none";

    document.getElementById("account-container").style.display = "block";
}

function showContainer(containerId) {
    var containers = document.querySelectorAll('.Information-Container');
    containers.forEach(function(container) {
        if (container.id === containerId) {
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    });
}

document.addEventListener("DOMContentLoaded", function() {
    showContainer('account-container');

    const buttons = document.querySelectorAll('.Main-Button');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            buttons.forEach(btn => {
                btn.classList.remove('active');
            });

            this.classList.add('active');
        });
    });
});
