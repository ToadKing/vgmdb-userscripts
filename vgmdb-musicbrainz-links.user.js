// ==UserScript==
// @name     VGMdb Musicbrainz Links
// @version  0.2
// @grant    none
// @include  https://vgmdb.net/album/*
// @run-at   document-end
// ==/UserScript==

const relationType = {
  VGMDB_URL: 'vgmdb_url',
  BARCODE: 'barcode',
}

const mbReleases = new Map()

function addRelease(id, title, type) {
  if (mbReleases.has(id)) {
    mbReleases.get(id)[type] = true
  } else {
    mbReleases.set(id, {
      title,
      [type]: true,
    })
  }
}

const pageLink = document.querySelector('link[rel=canonical]')
if (!pageLink) {
  return
}

const pageUrl = pageLink.href

const urlRelationships = fetch(`https://musicbrainz.org/ws/2/url/?query=url%3A${encodeURIComponent(pageUrl)}&fmt=json`).then((res) => res.json()).then((response) => {
  for (const url of response.urls) {
    for (const relationList of url['relation-list']) {
      for (const relation of relationList.relations) {
        if (relation.release) {
          addRelease(relation.release.id, relation.release.title, relationType.VGMDB_URL)
        }
      }
    }
  }
})

let barcodeRelationships

const barcodeLabel = document.evaluate('//td/span[@class="label"]/b[text()="Barcode"]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
if (barcodeLabel) {
  const barcode = barcodeLabel.closest('td').nextElementSibling.textContent
  barcodeRelationships = fetch(`https://musicbrainz.org/ws/2/release/?query=barcode%3A${encodeURIComponent(barcode)}&fmt=json`).then((res) => res.json()).then((response) => {
    for (const release of response.releases) {
      addRelease(release.id, release.title, relationType.BARCODE)
    }
  })
} else {
  barcodeRelationships = Promise.resolve()
}

Promise.allSettled([urlRelationships, barcodeRelationships]).finally(() => {
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

    for (const [id, release] of mbReleases) {
      linkContainer.appendChild(document.createElement('br'))
      const link = document.createElement('a')
      link.href = `https://musicbrainz.org/release/${id}`
      link.textContent = release.title
      if (barcodeLabel) {
        if (release[relationType.VGMDB_URL] && !release[relationType.BARCODE]) {
          link.style.backgroundColor = 'pink'
          link.style.color = 'red'
          link.title = 'Release has VGMdb URL but no barcode'
        } else if (!release[relationType.VGMDB_URL] && release[relationType.BARCODE]) {
          link.style.backgroundColor = 'pink'
          link.style.color = 'red'
          link.title = 'Release has barcode but no VGMdb URL'
        }
      }
      linkContainer.appendChild(link)
    }

    sidebar.appendChild(linkContainer)
  }
})
