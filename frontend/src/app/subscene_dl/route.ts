import { NextResponse } from "next/server";
const { JSDOM } = require("jsdom");

const LANG_MAP: {[key: string] : string[]} = {
	"en" : ["English"],
	"ms": ["Malay", "Indonesian"]
}

// This indirection is required due to CORS and subscene does not have REST API
export async function GET(request: Request) {
	const url = new URL(request.url);
	const imdbid = url.searchParams.get('imdbid');
	const lang = url.searchParams.get('lang') || "en";
	const accepted_langs = LANG_MAP[lang]

	if (!imdbid)
		return NextResponse.json({ detail: "imdbid is required" }, {status: 400});

	if (!accepted_langs)
		return NextResponse.json({ detail: `invalid lang "${lang}"` }, {status: 400});

	try {
		let data_raw = await fetch(`https://sub-scene.com/search?query=${imdbid}`)
		let data_text = await data_raw.text()	
		let dom = new JSDOM(data_text)

		const title_div = dom.window.document.getElementsByClassName("title")[0]
		
		if (title_div.textContent.includes("No entity found for"))
			return NextResponse.json({ detail: `No movie found for imdb id "${imdbid}"`}, {status: 404});

		const subscene_id_link = title_div.querySelector('a').getAttribute('href')
		data_raw = await fetch(`https://sub-scene.com${subscene_id_link}`)
		data_text = await data_raw.text()	
		dom = new JSDOM(data_text)

		let found_download = ''
		const subtitles_list =  dom.window.document.querySelector("tbody")
		for (var i = 0; i < subtitles_list.children.length; i++) {
			const subtitle_row = subtitles_list.children[i];
			const curr_lang = subtitle_row.querySelector("span").textContent.trim()
			if (!accepted_langs.includes(curr_lang))
				continue
			const subtitle_id = subtitle_row.querySelector("a").getAttribute('href')
			found_download = `https://sub-scene.com${subtitle_id.replace('subtitle', 'download')}`
		}

		if (found_download == '')
			return NextResponse.json({ detail: `No subtitle found for language "${lang}"`}, {status: 404});
		return NextResponse.json({ data: found_download });
	} catch (error) {
		console.log(error)
		return NextResponse.json({ detail: error }, {status: 500});
	}
}