var LocationManager = {
    getCountry: function(callback) {
        jQuery.getJSON('http://freegeoip.net/json/', function(location) {
            callback(location.country_code);
        });
    }
};

function getMsg(key) {
    switch (countryCode) {
        case 'KR':
            return KR[key];
        default:
            return EN[key];
    }
}

// Notify message translations
var KR = {
    added: '추가되었습니다',
    alreadyOnPlaylist: '이미 플레이리스트에 있습니다',
    shared: '이 URL을 공유해보세요! \n',
    loaded: '리스트를 불러왔습니다',
    cleared: '리스트가 삭제되었습니다',
    invalidUrl: '지원하지 않는 형식의 url 입니다',
    inSharedPlaylist: '당신은 공유된 플레이리스트로 접속했습니다.\n'
    + '이 플레이리스트는 당신의 플레이리스트에 영향을 끼치지 않습니다.\n'
    + '플레이리스트를 만드시려면 ' + fullHost + ' 로 접속해주세요',
    notPlayable: 'Soundcloud의 문제로 현재 재생이 불가능한 곡입니다. : ',
    cannotShare: '리스트가 비어있어서 공유할 수 없습니다.'
};

var EN = {
    added: 'Music added',
    alreadyOnPlaylist: 'Already on playlist',
    shared: 'Share this URL to your friends! \n',
    loaded: 'Playlist loaded!',
    cleared: 'Playlist cleared!',
    invalidUrl: 'URL not supported!',
    inSharedPlaylist: 'You are on shared playlist. \n'
    + 'All changes in this playlist will not affect yours.\n'
    + 'If you want to make your own playlist, access to ' + fullHost,
    notPlayable: 'This track is currently unavailable '
    + 'because of trouble in soundcloud : ',
    cannotShare: 'You cannot share an empty playlist'
};
