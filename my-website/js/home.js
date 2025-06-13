const API_KEY = 'a1e72fd93ed59f56e6332813b9f8dcae';
    const BASE_URL = 'https://api.themoviedb.org/3';
    const IMG_URL = 'https://image.tmdb.org/t/p/original';
    let currentItem;

    async function fetchTrending(type) {
      const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
      const data = await res.json();
      return data.results;
    }

    async function fetchTrendingAnime() {
  let allResults = [];

  // Fetch from multiple pages to get more anime (max 3 pages for demo)
  for (let page = 1; page <= 3; page++) {
    const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`);
    const data = await res.json();
    const filtered = data.results.filter(item =>
      item.original_language === 'ja' && item.genre_ids.includes(16)
    );
    allResults = allResults.concat(filtered);
  }

  return allResults;
}


    function displayBanner(item) {
      document.getElementById('banner').style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
      document.getElementById('banner-title').textContent = item.title || item.name;
    }

    function displayList(items, containerId) {
      const container = document.getElementById(containerId);
      container.innerHTML = '';
      items.forEach(item => {
       
        const img = document.createElement('img');
        img.src = `${IMG_URL}${item.poster_path}`;
        img.alt = item.title || item.name || "Movie Poster from Cine Royale";
        img.onclick = () => showDetails(item);
        container.appendChild(img);
      });
    }

    async function populateSeasons(tvId) {
  const res = await fetch(`${BASE_URL}/tv/${tvId}?api_key=${API_KEY}`);
  const data = await res.json();

  const seasonSelect = document.getElementById('season-select');
  seasonSelect.innerHTML = '';
  data.seasons.forEach(season => {
    const option = document.createElement('option');
    option.value = season.season_number;
    option.textContent = `Season ${season.season_number}`;
    seasonSelect.appendChild(option);
  });

  seasonSelect.onchange = () => populateEpisodes(tvId, seasonSelect.value);
  if (data.seasons.length > 0) {
    populateEpisodes(tvId, data.seasons[0].season_number);
  }
}

async function populateEpisodes(tvId, seasonNumber) {
  const res = await fetch(`${BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}`);
  const data = await res.json();

  const episodeSelect = document.getElementById('episode-select');
  episodeSelect.innerHTML = '';
  data.episodes.forEach(episode => {
    const option = document.createElement('option');
    option.value = episode.episode_number;
    option.textContent = `Episode ${episode.episode_number}: ${episode.name}`;
    episodeSelect.appendChild(option);
  });

  episodeSelect.onchange = () => changeServer(); // Update embed on episode change
}


    async function showDetails(item) {
  currentItem = item;
  const isTV = item.media_type === "tv" || item.original_language === 'ja';

  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview;
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
  document.getElementById('modal-rating').innerHTML = '★'.repeat(Math.round(item.vote_average / 2));

  document.getElementById('season-episode-selectors').style.display = isTV ? 'block' : 'none';
  
  if (isTV) {
    await populateSeasons(item.id);
  }

  changeServer();
  document.getElementById('modal').style.display = 'flex';
}


    function changeServer() {
  const server = document.getElementById('server').value;
  const type = currentItem.media_type === "movie" ? "movie" : "tv";
  let embedURL = "";

  const isTV = type === "tv";
  const season = isTV ? document.getElementById('season-select')?.value : null;
  const episode = isTV ? document.getElementById('episode-select')?.value : null;

  if (server === "vidsrc.cc") {
    if (isTV && season && episode) {
      embedURL = `https://vidsrc.cc/v2/embed/tv/${currentItem.id}/${season}/${episode}`;
    } else {
      embedURL = `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`;
    }
  } else if (server === "vidsrc.me") {
    embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id}`;
  } else if (server === "player.videasy.net") {
    embedURL = `https://player.videasy.net/${type}/${currentItem.id}`;
  }

  document.getElementById('modal-video').src = embedURL;
}


    function closeModal() {
      document.getElementById('modal').style.display = 'none';
      document.getElementById('modal-video').src = '';
    }

    function openSearchModal() {
      document.getElementById('search-modal').style.display = 'flex';
      document.getElementById('search-input').focus();
    }

    function closeSearchModal() {
      document.getElementById('search-modal').style.display = 'none';
      document.getElementById('search-results').innerHTML = '';
    }

    async function searchTMDB() {
  const query = document.getElementById('search-input').value;
  const selectedGenres = Array.from(document.querySelectorAll('#genre-filters input:checked')).map(cb => parseInt(cb.value));

  if (!query.trim()) {
    document.getElementById('search-results').innerHTML = '';
    return;
  }

  const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}`);
  const data = await res.json();

  const filteredResults = data.results.filter(item => {
    if (!item.genre_ids || item.genre_ids.length === 0) return false;
    if (selectedGenres.length === 0) return true;
    return selectedGenres.some(genre => item.genre_ids.includes(genre));
  });

  const container = document.getElementById('search-results');
  container.innerHTML = '';

  filteredResults.forEach(item => {
    if (!item.poster_path) return;
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.onclick = () => {
      closeSearchModal();
      showDetails(item);
    };
    container.appendChild(img);
  });
}


    async function init() {
      const movies = await fetchTrending('movie');
      const tvShows = await fetchTrending('tv');
      const anime = await fetchTrendingAnime();

      displayBanner(movies[Math.floor(Math.random() * movies.length)]);
      displayList(movies, 'movies-list');
      displayList(tvShows, 'tvshows-list');
      displayList(anime, 'anime-list');
    }

    init();
    document.querySelectorAll('#genre-filters input').forEach(cb => {
  cb.addEventListener('change', searchTMDB);
});
