import urllib.request, urllib.parse, re
url = 'https://html.duckduckgo.com/html/?q=' + urllib.parse.quote('site:raw.githubusercontent.com "kisah nabi" json')
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode()
    links = re.findall(r'https://raw\.githubusercontent\.com[^\s\"<>]+', html)
    print("Found links:")
    for link in set(links):
        print(link)
except Exception as e:
    print("Error:", e)
