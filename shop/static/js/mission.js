function handleScroll() {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;

    const div1 = document.querySelector(".div-1");
    const div2 = document.querySelector(".div-2");
    const div3 = document.querySelector(".div-3");

    div1.classList.remove("visible");
    div2.classList.remove("visible");
    div3.classList.remove("visible");

    if (scrollY < vh) {
        div1.style.visibility = "visible";
        div1.classList.add("visible");
    } else if (scrollY >= vh && scrollY < 2 * vh) {
        div2.style.visibility = "visible";
        div2.classList.add("visible");
    } else if (scrollY >= 2 * vh) {
        div3.style.visibility = "visible";
        div3.classList.add("visible");
    }
}

window.addEventListener("scroll", handleScroll);
window.addEventListener("load", handleScroll);
