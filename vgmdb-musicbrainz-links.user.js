// ==UserScript==
// @name     VGMdb Musicbrainz Links
// @version  0.1
// @grant    none
// @include  https://vgmdb.net/album/*
// @run-at document-end
// ==/UserScript==

(async () => {
  try {
    const pageUrl = document.querySelector('link[rel=canonical]').href
    
    const res = await fetch(`https://musicbrainz.org/ws/2/url/?query=url%3A${encodeURIComponent(pageUrl)}&fmt=json`)
    const response = await res.json()
    
    const mbReleases = new Set()
    
    for (const url of response.urls) {
      for (const relationList of url['relation-list']) {
        for (const relation of relationList.relations) {
          if (relation.release) {
            mbReleases.add({
              title: relation.release.title,
              url: `https://musicbrainz.org/release/${relation.release.id}`
            })
          }
        }
      }
    }
    
    if (mbReleases.size > 0) {
      const sidebar = document.querySelector('#rightcolumn')
      sidebar.appendChild(document.createElement('br'))

      const linkContainer = document.createElement('div')
      linkContainer.className = 'smallfont'
      linkContainer.style.width = '250px'
      linkContainer.style.padding = '6px 10px'
      linkContainer.style.backgroundColor = '#2F364F'
      linkContainer.style.borderRadius = '5px'
      linkContainer.style.boxSizing = 'border-box'

      linkContainer.appendChild(document.createTextNode('MB:'))
      
      for (const release of mbReleases) {
        linkContainer.appendChild(document.createElement('br'))
        const link = document.createElement('a')
        link.href = release.url
        link.textContent = release.title
        linkContainer.appendChild(link)
      }

      sidebar.appendChild(linkContainer)
    }
  } catch(e) {}
})()
