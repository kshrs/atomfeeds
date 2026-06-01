const wrapper = document.querySelector(".content-wrapper");

async function loadFeeds() {
    try {
	const response = await fetch("./feeds/feeds.json");
	const feeds = await response.json();

	let contentBuffer = `<span class="heading">#feeds</span>`

	
	feeds.forEach(feed => {
	    contentBuffer += `<a class="feed-item" href="${feed.url}">
<div class="feed-top">
<h2 class="feed-title">${feed.title}</h2>
<span class="feed-time">${feed.date}</span>
</div>
<p class="feed-desc">${feed.desc}</p>
</a>`;
	});
	wrapper.innerHTML = contentBuffer;
    } catch (error) {
	console.error("Error loading feeds:", error);
	document.querySelector(".content-wrapper").innerHTML = `<a class="feed-item" href="#"><div class="feed-top"><h2 class="feed-title">Failed to load feeds</h2></div></a>`;
    }
}

wrapper.addEventListener("click", async (e) => {
    e.preventDefault(); 

    const link = e.target.closest(".feed-item");

    if (link) {
        const url = link.getAttribute("href");
        await loadPost(url);
    }
});


const parser = new DOMParser();

async function loadPost(url) {
    try {
	const response = await fetch(url);
	const htmlString = await response.text();

	const doc = parser.parseFromString(htmlString, "text/html");
	const feedContent = doc.body.innerHTML;
	wrapper.innerHTML = `<a href="#" id="back-button" class="back-button"> <- back to #feeds</a>
<div class="blog" id="blog">${feedContent}</div>`

	document.getElementById("back-button").addEventListener("click", (e) => {
	    loadFeeds();
	});
    } catch (error) {
	console.error("Error loading post:", error);
        wrapper.innerHTML = `
            <button id="back-button" class="back-button">← back to #feeds</button>
            <p>Failed to load post content.</p>
        `;
        document.getElementById("back-button").addEventListener("click", () => loadFeeds());
    }
}

async function loadData() {
    try {
	const response = await fetch ("./user-assets/data.json");
	const data = await response.json();
	document.querySelector(".metadata").innerHTML = `Last Updated: ${data.last_updated}`;
	document.querySelector(".profile-image").innerHTML = `<div class="image-tooltip-wrapper" data-alt="${data.profile_image_desc}">
<img src="${data.profile_image_url}" alt="${data.profile_image_desc}" />
		    </div>`;
	const links = data.contact_links;
	const links_wrapper = document.querySelector(".buttons");
	let contentBuffer = "";
	links.forEach(link => {
	    contentBuffer += `<a class="button-style ${link.name}" href="${link.url}" style="background-color: ${link.bg_color}; color: ${link.fg_color}; display: inline-block; text-decoration: none;">${link.name}</a>`;

	});
	links_wrapper.innerHTML = contentBuffer;

	const aboutResponse = await fetch(data.about_url);
	const htmlString = await aboutResponse.text();

	const doc = parser.parseFromString(htmlString, "text/html");
	const aboutContent = doc.body.innerHTML;
	document.querySelector(".about").innerHTML = `${aboutContent}`;
    } catch (error) {
	console.error("Error updating data: last_updated: ", error);
    }
}

loadData();
loadFeeds();
