module.exports = {
  messenger: {
    url: 'https://graph.facebook.com/v2.6/me/messages'
  },
  apiai: {
    postKuralPath: '/ai',
    postKuralPathV2: '/aiv2',
    kuralIntent: 'kural',
    loveIntent: 'love',
    aramIntent: 'aram',
    porulIntent: 'porul',
    randomIntent: 'random',
    bookOptions: 'bookOptions',
    searchIntent: 'search',
    feedbackIntent: 'feedback'
  },
  kural: {
    url: 'https://thirukkuralapi.herokuapp.com/public/item/%E0%AE%A4%E0%AE%BF%E0%AE%B0%E0%AF%81%E0%AE%95%E0%AF%8D%E0%AE%95%E0%AF%81%E0%AE%B1%E0%AE%B3%E0%AF%8D/',
    min: 1,
    max: 1330,
    loveStart: 1081,
    loveEnd: 1330,
    aramStart: 1,
    aramEnd: 380,
    porulStart: 381,
    porulEnd: 1080,
    randomStart: 1,
    randomEnd: 1330
  },
  mailConfig: {
    host: 'smtp.gmail.com',
    port: 465
  },
  mailDetails: {
    from: 'vengaishiva@gmail.com',
    to: 'vengaishiva+kuralbot.@gmail.com',
    subject: 'Feedback from Kural Bot',
    html: ''
  },
}