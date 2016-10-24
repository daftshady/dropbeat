"""Wraps youtube api and data pipelines.

"""

import json
import urllib
import traceback

import requests
from bs4 import BeautifulSoup
from celeryapp import app


class Youtube(object):
    @staticmethod
    def search_from_html(keyword):
        """Get search result by parsing youtube HTML.
        Youtube api v3 lacks some necessary data such as video duration,
        quality. Parsing youtube search result directly is the only way to
        get those information.
        Because this is not legitimate access to youtube, machine ip could be
        banned as the number of req/s increases.
        Request throttling with multiple proxies can be a possible workaround.
        (or simply forget about the duration..)

        """
        try:
            # Because this query will be contained in GET param.
            q = urllib.quote(keyword)
        except Exception:
            q = keyword

        url = 'https://www.youtube.com/results?search_query=' + q
        try:
            resp = requests.get(url, timeout=5.0)
            resp.raise_for_status()
        except requests.exceptions.Timeout:
            return []
        except requests.exceptions.HTTPError:
            # Log this error.
            return []

        # Ignore magic numbers as HTML parsers are hardly reusable
        soup = BeautifulSoup(resp.content, 'lxml')
        elems = soup.find_all('div', {'class': 'yt-lockup-content'})

        # `elems` contains some ads and real search results.
        # Filter search result only.
        elems = [x for x in elems if x.find('a').has_attr('aria-describedby')]

        tracks = []
        for elem in elems:
            try:
                uid = elem.find_all('a')[0]['href'].split('v=')[1]
                title = elem.find('a', {
                    'aria-describedby': lambda x: x is not None})['title']
                duration = elem.find('span',
                    {'class': 'accessible-description'}).text.split(': ', 1)[1]

                tracks.append({
                    'title': title,
                    'id': uid,
                    'duration': duration,
                    'thumbnail': 'https://i.ytimg.com/vi/%s/hqdefault.jpg' % uid
                })
            except Exception:
                # 1. HTML form has been changed.
                # 2. Search result can contain non-video elems such as channel,
                # playlist. In this case, as elem HTML doesn't fit into
                # video form, exception occurs.
                # TODO: Should do logging only for case 1
                continue

        return tracks


@app.task
def youtube_search(query):
    return Youtube.search_from_html(query)
