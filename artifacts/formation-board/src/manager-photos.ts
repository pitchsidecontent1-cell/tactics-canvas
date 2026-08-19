// Manager portraits, all sourced from Wikimedia Commons under free licences
// (CC0 / CC BY / CC BY-SA). Files live in public/managers and are served from
// the app's base path. Every CC BY and CC BY-SA licence requires visible
// attribution, so `ManagerPhotoCredit` renders the author, licence and a link
// back to the source file beneath each photo — do not drop that credit line.
//
// To swap a photo: download a freely licensed file from Commons, drop it in
// public/managers, and update both the file name and the credit here.

export type ManagerPhoto = {
  file: string;
  author: string;
  licence: string;
  licenceUrl: string;
  source: string;
};

export const MANAGER_PHOTOS: Record<string, ManagerPhoto> = {
  'Alex Ferguson': {
    file: 'ferguson.jpg',
    author: 'Andrea Sartorati',
    licence: 'CC BY 2.0',
    licenceUrl: 'https://creativecommons.org/licenses/by/2.0',
    source: 'https://commons.wikimedia.org/wiki/File:Alex_Ferguson_2011.jpg',
  },
  'Pep Guardiola': {
    file: 'guardiola.jpg',
    author: 'Богдан Заяц',
    licence: 'CC BY-SA 3.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Pep_Guardiola_2015.jpg',
  },
  'José Mourinho': {
    file: 'mourinho.jpg',
    author: 'Steffen Prößdorf',
    licence: 'CC BY-SA 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Jos%C3%A9_Mourinho_2020_(cropped).jpg',
  },
  'Carlo Ancelotti': {
    file: 'ancelotti.jpg',
    author: 'Мельников Александр',
    licence: 'CC BY-SA 3.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Carlo_Ancelotti_in_Russia.jpg',
  },
  'Johan Cruyff': {
    file: 'cruyff.jpg',
    author: 'Rob Mieremet / Anefo',
    licence: 'CC0',
    licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/deed.en',
    source: 'https://commons.wikimedia.org/wiki/File:Johan_Cruyff_1974c.jpg',
  },
  'Arsène Wenger': {
    file: 'wenger.jpg',
    author: 'Gaius Cornelius',
    licence: 'CC BY-SA 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Arsene_Wenger_JHayes_(cropped).jpg',
  },
  'Luis Enrique': {
    file: 'luis-enrique.jpg',
    author: 'L.F. Salas',
    licence: 'CC BY 2.0',
    licenceUrl: 'https://creativecommons.org/licenses/by/2.0',
    source: 'https://commons.wikimedia.org/wiki/File:Luis_Enrique_2014_cropped.jpg',
  },
  'Jürgen Klopp': {
    file: 'klopp.jpg',
    author: 'Tim Reckmann',
    licence: 'CC BY-SA 3.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Juergen_Klopp_2014.jpg',
  },
  'Zinédine Zidane': {
    file: 'zidane.jpg',
    author: 'power axle',
    licence: 'CC BY 2.0',
    licenceUrl: 'https://creativecommons.org/licenses/by/2.0',
    source: 'https://commons.wikimedia.org/wiki/File:Zinedine_Zidane_2015_(cropped).jpg',
  },
  "Mikel Arteta": {
    file: "arteta.jpg",
    author: "Prime Video AU &amp; NZ",
    licence: "CC BY 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by/3.0",
    source: "https://commons.wikimedia.org/wiki/File:Mikel_Arteta_2021_(cropped).png",
  },
  "Unai Emery": {
    file: "emery.jpg",
    author: "Aleksandr Osipov",
    licence: "CC BY-SA 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
    source: "https://commons.wikimedia.org/wiki/File:Unai_Emery_-_Sevilla_(cropped).jpg",
  },
  "Xabi Alonso": {
    file: "xabi-alonso.jpg",
    author: "DONOSTIA KULTURA",
    licence: "CC BY-SA 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
    source: "https://commons.wikimedia.org/wiki/File:Los_Caminos_del_f%C3%BAtbol._Xabi_Alonso_(39666778464)_(cropped).jpg",
  },
  "Rúben Amorim": {
    file: "amorim.jpg",
    author: "Agência Lusa",
    licence: "CC BY 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by/3.0",
    source: "https://commons.wikimedia.org/wiki/File:RubenAmorim3.png",
  },
  "Vincent Kompany": {
    file: "kompany.jpg",
    author: "ManuluxWiki",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://commons.wikimedia.org/wiki/File:Vincent_Kompany_Bayern_Munich.jpg",
  },
  "Thomas Tuchel": {
    file: "tuchel.jpg",
    author: "Bryan Berlin",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://commons.wikimedia.org/wiki/File:Thomas_Tuchel_England_v_Ghana_23_June_2026-081.jpg",
  },
  "Hansi Flick": {
    file: "flick.jpg",
    author: "Steffen Prößdorf",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://commons.wikimedia.org/wiki/File:2022_Hansi_Flick_(cropped).jpg",
  },
  "Diego Simeone": {
    file: "simeone.jpg",
    author: "Barcex",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://commons.wikimedia.org/wiki/File:25th_Laureus_World_Sports_Awards_-_Red_Carpet_-_Diego_Simeone_-_240422_192621-2_(cropped).jpg",
  },
  "Bill Shankly": {
    file: "shankly.jpg",
    author: "Rodhullandemu",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://commons.wikimedia.org/wiki/File:Bill_Shankly_statue%2C_Anfield_2018.jpg",
  },
  "Bob Paisley": {
    file: "paisley.jpg",
    author: "Rodhullandemu",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://commons.wikimedia.org/wiki/File:Paisley_cu%2C_Bob_Paisley_statue%2C_Anfield.jpg",
  },
  "Arrigo Sacchi": {
    file: "sacchi.jpg",
    author: "Elena Torre",
    licence: "CC BY-SA 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
    source: "https://commons.wikimedia.org/wiki/File:Arrigo_Sacchi_2007_(cropped).jpg",
  },
  "Fabio Capello": {
    file: "capello.jpg",
    author: "Садовников Дмитрий",
    licence: "CC BY-SA 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    source: "https://commons.wikimedia.org/wiki/File:Fabio_Capello_2012.jpg",
  },
  "Vicente del Bosque": {
    file: "del-bosque.jpg",
    author: "Steindy (talk) 08:39, 5 June 2010 (UTC)",
    licence: "CC BY-SA 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    source: "https://commons.wikimedia.org/wiki/File:Vicente_del_Bosque_-_Teamchef_Spain_(02)_(cropped).jpg",
  },
  "Rinus Michels": {
    file: "michels.jpg",
    author: "Rob Bogaerts for Anefo",
    licence: "CC0",
    licenceUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    source: "https://commons.wikimedia.org/wiki/File:Rinus_Michels_(1984).jpg",
  },
  "Jupp Heynckes": {
    file: "heynckes.jpg",
    author: "Александр Осипов",
    licence: "CC BY-SA 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    source: "https://commons.wikimedia.org/wiki/File:Jupp_Heynckes_(cropped).jpg",
  },
  "Marcello Lippi": {
    file: "lippi.jpg",
    author: "International Journalism Festival",
    licence: "CC BY-SA 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
    source: "https://commons.wikimedia.org/wiki/File:Marcello_Lippi_by_Martina_De_Siervo_-_International_Journalism_Festival_2010.jpg",
  },
  "Kenny Dalglish": {
    file: "dalglish.jpg",
    author: "Saw from Singapore",
    licence: "CC BY-SA 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
    source: "https://commons.wikimedia.org/wiki/File:Kenny_Dalglish_2009_Singapore.jpg",
  },
  "Luis Aragonés": {
    file: "aragones.jpg",
    author: "Doha Stadium Plus Qatar",
    licence: "CC BY 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by/2.0",
    source: "https://commons.wikimedia.org/wiki/File:Luis_Aragones_2011.jpg",
  },
  "Rafael Benítez": {
    file: "benitez.jpg",
    author: "Дмитрий Журавель",
    licence: "CC BY-SA 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    source: "https://commons.wikimedia.org/wiki/File:Shahter-Reak_M_2015_(2).jpg",
  },
};

export const managerPhotoUrl = (file: string) => `${import.meta.env.BASE_URL}managers/${file}`;
