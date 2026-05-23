const https = require('https');

async function fetchYoutubeSearch(query) {
  return new Promise((resolve, reject) => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`;
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseDuration(durationText) {
  if (!durationText) return 0;
  const parts = durationText.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

async function test() {
  try {
    console.log("Fetching search results page...");
    const html = await fetchYoutubeSearch("7liwa");
    console.log("HTML length:", html.length);
    
    // Find ytInitialData block
    const match = html.match(/ytInitialData\s*=\s*({.+?});/);
    if (!match) {
      console.log("Could not find ytInitialData in HTML!");
      // Let's write first 2000 chars to check
      console.log(html.substring(0, 500));
      return;
    }
    
    console.log("Found ytInitialData! Parsing...");
    const json = JSON.parse(match[1]);
    const contents = json.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents;
    const itemSection = contents.find(c => c.itemSectionRenderer);
    const results = itemSection ? itemSection.itemSectionRenderer.contents : [];
    
    console.log(`Found ${results.length} total raw items.`);
    
    const tracks = [];
    for (const item of results) {
      if (item.videoRenderer) {
        const video = item.videoRenderer;
        const durationText = video.lengthText?.simpleText || '0:00';
        tracks.push({
          id: video.videoId,
          title: video.title.runs[0].text,
          artist: video.ownerText.runs[0].text,
          duration: parseDuration(durationText),
          thumbnail: video.thumbnail.thumbnails[0].url
        });
      }
    }
    
    console.log("Successfully extracted tracks:");
    console.log(JSON.stringify(tracks.slice(0, 3), null, 2));
  } catch (e) {
    console.error("Error during test:", e);
  }
}

test();
