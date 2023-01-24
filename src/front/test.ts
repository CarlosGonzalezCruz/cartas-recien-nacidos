
(async () => {
    let response = await fetch("test-content");
    let text = await response.text();
    $("#test").text(text);
})();