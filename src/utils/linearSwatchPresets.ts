export interface LinearSwatchPreset {
  id: string;
  name: string;
  css: string;
}

export const LINEAR_SWATCH_PRESETS: LinearSwatchPreset[] = [
  {
    id: 'ls-1',
    name: 'Dark Steps',
    css: 'linear-gradient(90deg, #05050a 0.000%, #05050a 7.692%, #090a0e calc(7.692% + 1px), #090a0e 15.385%, #0d0e12 calc(15.385% + 1px), #0d0e12 23.077%, #121316 calc(23.077% + 1px), #121316 30.769%, #16171a calc(30.769% + 1px), #16171a 38.462%, #1a1b1e calc(38.462% + 1px), #1a1b1e 46.154%, #1e1f22 calc(46.154% + 1px), #1e1f22 53.846%, #222326 calc(53.846% + 1px), #222326 61.538%, #26272a calc(61.538% + 1px), #26272a 69.231%, #292a2d calc(69.231% + 1px), #292a2d 76.923%, #2c2d30 calc(76.923% + 1px), #2c2d30 84.615%, #2e2f33 calc(84.615% + 1px), #2e2f33 92.308%, #303135 calc(92.308% + 1px) 100.000%)',
  },
  {
    id: 'ls-2',
    name: 'Forest Earth',
    css: 'linear-gradient(285deg, #dac5b3 0.000%, #dac5b3 20.000%, #acb6a4 calc(20.000% + 1px), #acb6a4 40.000%, #799d8d calc(40.000% + 1px), #799d8d 60.000%, #567f70 calc(60.000% + 1px), #567f70 80.000%, #515f4f calc(80.000% + 1px) 100.000%)',
  },
  {
    id: 'ls-3',
    name: 'Warm Cream',
    css: 'linear-gradient(45deg, #ffffd6 0.000%, #ffffd6 14.286%, #fff1c5 calc(14.286% + 1px), #fff1c5 28.571%, #f0dcb8 calc(28.571% + 1px), #f0dcb8 42.857%, #dbc6b3 calc(42.857% + 1px), #dbc6b3 57.143%, #c6b5b8 calc(57.143% + 1px), #c6b5b8 71.429%, #b7acc4 calc(71.429% + 1px), #b7acc4 85.714%, #b0afd5 calc(85.714% + 1px) 100.000%)',
  },
  {
    id: 'ls-4',
    name: 'Rainbow Spectrum',
    css: 'linear-gradient(45deg, #77abdc 0.000%, #77abdc 7.692%, #63bbdc calc(7.692% + 1px), #63bbdc 15.385%, #58ccd2 calc(15.385% + 1px), #58ccd2 23.077%, #59dbc1 calc(23.077% + 1px), #59dbc1 30.769%, #65e4ac calc(30.769% + 1px), #65e4ac 38.462%, #7ae695 calc(38.462% + 1px), #7ae695 46.154%, #95e081 calc(46.154% + 1px), #95e081 53.846%, #b1d474 calc(53.846% + 1px), #b1d474 61.538%, #cac36f calc(61.538% + 1px), #cac36f 69.231%, #dbb273 calc(69.231% + 1px), #dbb273 76.923%, #e1a581 calc(76.923% + 1px), #e1a581 84.615%, #dc9c94 calc(84.615% + 1px), #dc9c94 92.308%, #cd9cab calc(92.308% + 1px) 100.000%)',
  },
  {
    id: 'ls-5',
    name: 'Cotton Candy',
    css: 'linear-gradient(315deg, #abccff 0.000%, #abccff 14.286%, #bccdff calc(14.286% + 1px), #bccdff 28.571%, #d8ccff calc(28.571% + 1px), #d8ccff 42.857%, #f4c9f7 calc(42.857% + 1px), #f4c9f7 57.143%, #ffc5f0 calc(57.143% + 1px), #ffc5f0 71.429%, #ffc0ed calc(71.429% + 1px), #ffc0ed 85.714%, #ffbaed calc(85.714% + 1px) 100.000%)',
  },
  {
    id: 'ls-6',
    name: 'Purple Dusk',
    css: 'linear-gradient(315deg, #c5c2ef 0.000%, #c5c2ef 16.667%, #b5b0ff calc(16.667% + 1px), #b5b0ff 33.333%, #a19bfa calc(33.333% + 1px), #a19bfa 50.000%, #8a82d6 calc(50.000% + 1px), #8a82d6 66.667%, #7067b3 calc(66.667% + 1px), #7067b3 83.333%, #534aa8 calc(83.333% + 1px) 100.000%)',
  },
  {
    id: 'ls-7',
    name: 'Magenta Rose',
    css: 'linear-gradient(225deg, #631683 0.000%, #631683 12.500%, #7f237e calc(12.500% + 1px), #7f237e 25.000%, #9e3980 calc(25.000% + 1px), #9e3980 37.500%, #bc5588 calc(37.500% + 1px), #bc5588 50.000%, #d57496 calc(50.000% + 1px), #d57496 62.500%, #e494a8 calc(62.500% + 1px), #e494a8 75.000%, #e7b1be calc(75.000% + 1px), #e7b1be 87.500%, #dec8d6 calc(87.500% + 1px) 100.000%)',
  },
  {
    id: 'ls-8',
    name: 'Sunset Fire',
    css: 'linear-gradient(90deg, #453e64 0.000%, #453e64 7.692%, #664465 calc(7.692% + 1px), #664465 15.385%, #864b67 calc(15.385% + 1px), #864b67 23.077%, #a75569 calc(23.077% + 1px), #a75569 30.769%, #c8606b calc(30.769% + 1px), #c8606b 38.462%, #e76d6d calc(38.462% + 1px), #e76d6d 46.154%, #ff7b70 calc(46.154% + 1px), #ff7b70 53.846%, #ff8b73 calc(53.846% + 1px), #ff8b73 61.538%, #ff9c76 calc(61.538% + 1px), #ff9c76 69.231%, #ffae79 calc(69.231% + 1px), #ffae79 76.923%, #ffc07c calc(76.923% + 1px), #ffc07c 84.615%, #ffd480 calc(84.615% + 1px), #ffd480 92.308%, #ffe783 calc(92.308% + 1px) 100.000%)',
  },
  {
    id: 'ls-9',
    name: 'Steel Lavender',
    css: 'linear-gradient(210deg, #c5bbb8 0.000%, #c5bbb8 6.667%, #b8b5b8 calc(6.667% + 1px), #b8b5b8 13.333%, #a9afb7 calc(13.333% + 1px), #a9afb7 20.000%, #9aa8b5 calc(20.000% + 1px), #9aa8b5 26.667%, #8ba1b3 calc(26.667% + 1px), #8ba1b3 33.333%, #7d98af calc(33.333% + 1px), #7d98af 40.000%, #7090ab calc(40.000% + 1px), #7090ab 46.667%, #6587a6 calc(46.667% + 1px), #6587a6 53.333%, #5c7ea1 calc(53.333% + 1px), #5c7ea1 60.000%, #55759b calc(60.000% + 1px), #55759b 66.667%, #516c94 calc(66.667% + 1px), #516c94 73.333%, #4f638d calc(73.333% + 1px), #4f638d 80.000%, #505a85 calc(80.000% + 1px), #505a85 86.667%, #54537d calc(86.667% + 1px), #54537d 93.333%, #5b4b74 calc(93.333% + 1px) 100.000%)',
  },
  {
    id: 'ls-10',
    name: 'Ocean Teal',
    css: 'linear-gradient(45deg, #004069 0.000%, #004069 7.692%, #005d6f calc(7.692% + 1px), #005d6f 15.385%, #007a77 calc(15.385% + 1px), #007a77 23.077%, #009782 calc(23.077% + 1px), #009782 30.769%, #00b18e calc(30.769% + 1px), #00b18e 38.462%, #03c99c calc(38.462% + 1px), #03c99c 46.154%, #05dcac calc(46.154% + 1px), #05dcac 53.846%, #08ebbd calc(53.846% + 1px), #08ebbd 61.538%, #0bf5ce calc(61.538% + 1px), #0bf5ce 69.231%, #0ff8e0 calc(69.231% + 1px), #0ff8e0 76.923%, #12f6f1 calc(76.923% + 1px), #12f6f1 84.615%, #16eeff calc(84.615% + 1px), #16eeff 92.308%, #19e0ff calc(92.308% + 1px) 100.000%)',
  },
  {
    id: 'ls-11',
    name: 'Terracotta Sage',
    css: 'linear-gradient(45deg, #c2615d 0.000%, #c2615d 7.692%, #c1625e calc(7.692% + 1px), #c1625e 15.385%, #bd6761 calc(15.385% + 1px), #bd6761 23.077%, #b76f66 calc(23.077% + 1px), #b76f66 30.769%, #ae796e calc(30.769% + 1px), #ae796e 38.462%, #a38478 calc(38.462% + 1px), #a38478 46.154%, #979184 calc(46.154% + 1px), #979184 53.846%, #8b9d90 calc(53.846% + 1px), #8b9d90 61.538%, #7fa99b calc(61.538% + 1px), #7fa99b 69.231%, #75b3a6 calc(69.231% + 1px), #75b3a6 76.923%, #6cbab0 calc(76.923% + 1px), #6cbab0 84.615%, #66bfb8 calc(84.615% + 1px), #66bfb8 92.308%, #62c0bd calc(92.308% + 1px) 100.000%)',
  },
  {
    id: 'ls-12',
    name: 'Aqua Indigo',
    css: 'linear-gradient(15deg, #0ee6dd 0.000%, #0ee6dd 10.000%, #43dddf calc(10.000% + 1px), #43dddf 20.000%, #54d0e2 calc(20.000% + 1px), #54d0e2 30.000%, #35c2e4 calc(30.000% + 1px), #35c2e4 40.000%, #00b2e7 calc(40.000% + 1px), #00b2e7 50.000%, #00a0e9 calc(50.000% + 1px), #00a0e9 60.000%, #008eec calc(60.000% + 1px), #008eec 70.000%, #007bee calc(70.000% + 1px), #007bee 80.000%, #2669f0 calc(80.000% + 1px), #2669f0 90.000%, #5057f3 calc(90.000% + 1px) 100.000%)',
  },
  {
    id: 'ls-13',
    name: 'Autumn Forest',
    css: 'linear-gradient(90deg, #2e3c45 0.000%, #2e3c45 2.941%, #2d454e calc(2.941% + 1px), #2d454e 5.882%, #2f5057 calc(5.882% + 1px), #2f5057 8.824%, #355d61 calc(8.824% + 1px), #355d61 11.765%, #3c6b6b calc(11.765% + 1px), #3c6b6b 14.706%, #477974 calc(14.706% + 1px), #477974 17.647%, #54877d calc(17.647% + 1px), #54877d 20.588%, #629585 calc(20.588% + 1px), #629585 23.529%, #73a28c calc(23.529% + 1px), #73a28c 26.471%, #84ad91 calc(26.471% + 1px), #84ad91 29.412%, #96b796 calc(29.412% + 1px), #96b796 32.353%, #a7bf99 calc(32.353% + 1px), #a7bf99 35.294%, #b8c59a calc(35.294% + 1px), #b8c59a 38.235%, #c8c89a calc(38.235% + 1px), #c8c89a 41.176%, #d7c999 calc(41.176% + 1px), #d7c999 44.118%, #e3c796 calc(44.118% + 1px), #e3c796 47.059%, #edc391 calc(47.059% + 1px), #edc391 50.000%, #f4bc8b calc(50.000% + 1px), #f4bc8b 52.941%, #f9b484 calc(52.941% + 1px), #f9b484 55.882%, #faa97c calc(55.882% + 1px), #faa97c 58.824%, #f99d74 calc(58.824% + 1px), #f99d74 61.765%, #f4906a calc(61.765% + 1px), #f4906a 64.706%, #ed8261 calc(64.706% + 1px), #ed8261 67.647%, #e37457 calc(67.647% + 1px), #e37457 70.588%, #d6664e calc(70.588% + 1px), #d6664e 73.529%, #c85845 calc(73.529% + 1px), #c85845 76.471%, #b74c3d calc(76.471% + 1px), #b74c3d 79.412%, #a64135 calc(79.412% + 1px), #a64135 82.353%, #95392f calc(82.353% + 1px), #95392f 85.294%, #83322a calc(85.294% + 1px), #83322a 88.235%, #722d27 calc(88.235% + 1px), #722d27 91.176%, #622b25 calc(91.176% + 1px), #622b25 94.118%, #532c25 calc(94.118% + 1px), #532c25 97.059%, #462f26 calc(97.059% + 1px) 100.000%)',
  },
  {
    id: 'ls-14',
    name: 'Emerald Mint',
    css: 'linear-gradient(225deg, #166383 0.000%, #166383 12.500%, #237f7e calc(12.500% + 1px), #237f7e 25.000%, #399e80 calc(25.000% + 1px), #399e80 37.500%, #55bc88 calc(37.500% + 1px), #55bc88 50.000%, #74d496 calc(50.000% + 1px), #74d496 62.500%, #94e3a8 calc(62.500% + 1px), #94e3a8 75.000%, #b1e7be calc(75.000% + 1px), #b1e7be 87.500%, #c8ded6 calc(87.500% + 1px) 100.000%)',
  },
  {
    id: 'ls-15',
    name: 'Mint Indigo',
    css: 'linear-gradient(240deg, #70ffd3 0.000%, #70ffd3 3.846%, #72ffd2 calc(3.846% + 1px), #72ffd2 7.692%, #74fcd1 calc(7.692% + 1px), #74fcd1 11.538%, #76f7d0 calc(11.538% + 1px), #76f7d0 15.385%, #78f1d0 calc(15.385% + 1px), #78f1d0 19.231%, #79ecd1 calc(19.231% + 1px), #79ecd1 23.077%, #7be6d2 calc(23.077% + 1px), #7be6d2 26.923%, #7ce0d4 calc(26.923% + 1px), #7ce0d4 30.769%, #7edad6 calc(30.769% + 1px), #7edad6 34.615%, #7fd3d9 calc(34.615% + 1px), #7fd3d9 38.462%, #80ccdd calc(38.462% + 1px), #80ccdd 42.308%, #81c6e1 calc(42.308% + 1px), #81c6e1 46.154%, #82bfe5 calc(46.154% + 1px), #82bfe5 50.000%, #83b7ea calc(50.000% + 1px), #83b7ea 53.846%, #83b0ee calc(53.846% + 1px), #83b0ee 57.692%, #84a9f3 calc(57.692% + 1px), #84a9f3 61.538%, #84a2f8 calc(61.538% + 1px), #84a2f8 65.385%, #849afe calc(65.385% + 1px), #849afe 69.231%, #8493ff calc(69.231% + 1px), #8493ff 73.077%, #848bff calc(73.077% + 1px), #848bff 76.923%, #8484ff calc(76.923% + 1px), #8484ff 80.769%, #847cff calc(80.769% + 1px), #847cff 84.615%, #8375ff calc(84.615% + 1px), #8375ff 88.462%, #826eff calc(88.462% + 1px), #826eff 92.308%, #8266ff calc(92.308% + 1px), #8266ff 96.154%, #815fff calc(96.154% + 1px) 100.000%)',
  },
  {
    id: 'ls-16',
    name: 'Aurora Pink',
    css: 'linear-gradient(45deg, #88deba 0.000%, #88deba 7.692%, #79dfc5 calc(7.692% + 1px), #79dfc5 15.385%, #70d9d1 calc(15.385% + 1px), #70d9d1 23.077%, #6dcfdc calc(23.077% + 1px), #6dcfdc 30.769%, #72c1e5 calc(30.769% + 1px), #72c1e5 38.462%, #7db1ea calc(38.462% + 1px), #7db1ea 46.154%, #8ca1ea calc(46.154% + 1px), #8ca1ea 53.846%, #9f93e6 calc(53.846% + 1px), #9f93e6 61.538%, #b389de calc(61.538% + 1px), #b389de 69.231%, #c683d3 calc(69.231% + 1px), #c683d3 76.923%, #d584c7 calc(76.923% + 1px), #d584c7 84.615%, #de89bc calc(84.615% + 1px), #de89bc 92.308%, #e194b3 calc(92.308% + 1px) 100.000%)',
  },
  {
    id: 'ls-17',
    name: 'Amber Purple',
    css: 'linear-gradient(90deg, #c1a180 0.000%, #c1a180 7.692%, #bb8f8a calc(7.692% + 1px), #bb8f8a 15.385%, #b47c93 calc(15.385% + 1px), #b47c93 23.077%, #ac6a9b calc(23.077% + 1px), #ac6a9b 30.769%, #a457a1 calc(30.769% + 1px), #a457a1 38.462%, #9b46a6 calc(38.462% + 1px), #9b46a6 46.154%, #9135aa calc(46.154% + 1px), #9135aa 53.846%, #8726ab calc(53.846% + 1px), #8726ab 61.538%, #7e18ab calc(61.538% + 1px), #7e18ab 69.231%, #740ca9 calc(69.231% + 1px), #740ca9 76.923%, #6a03a5 calc(76.923% + 1px), #6a03a5 84.615%, #6100a0 calc(84.615% + 1px), #6100a0 92.308%, #590099 calc(92.308% + 1px) 100.000%)',
  },
  {
    id: 'ls-18',
    name: 'Deep Ocean',
    css: 'linear-gradient(135deg, #083860 0.000%, #083860 14.286%, #00687a calc(14.286% + 1px), #00687a 28.571%, #0e9d9a calc(28.571% + 1px), #0e9d9a 42.857%, #40c6b1 calc(42.857% + 1px), #40c6b1 57.143%, #80d7b6 calc(57.143% + 1px), #80d7b6 71.429%, #bcc9a6 calc(71.429% + 1px), #bcc9a6 85.714%, #e1a288 calc(85.714% + 1px) 100.000%)',
  },
  {
    id: 'ls-19',
    name: 'Twilight Orchid',
    css: 'linear-gradient(180deg, #3d50a5 0.000%, #3d50a5 4.762%, #3c609f calc(4.762% + 1px), #3c609f 9.524%, #406d9e calc(9.524% + 1px), #406d9e 14.286%, #4b79a2 calc(14.286% + 1px), #4b79a2 19.048%, #5a83ab calc(19.048% + 1px), #5a83ab 23.810%, #6e8ab7 calc(23.810% + 1px), #6e8ab7 28.571%, #838fc3 calc(28.571% + 1px), #838fc3 33.333%, #9892cc calc(33.333% + 1px), #9892cc 38.095%, #ac92d0 calc(38.095% + 1px), #ac92d0 42.857%, #bc8fcf calc(42.857% + 1px), #bc8fcf 47.619%, #c88ac9 calc(47.619% + 1px), #c88ac9 52.381%, #ce83bf calc(52.381% + 1px), #ce83bf 57.143%, #cd79b3 calc(57.143% + 1px), #cd79b3 61.905%, #c66ea8 calc(61.905% + 1px), #c66ea8 66.667%, #ba60a0 calc(66.667% + 1px), #ba60a0 71.429%, #a9519d calc(71.429% + 1px), #a9519d 76.190%, #9541a1 calc(76.190% + 1px), #9541a1 80.952%, #7f2fa9 calc(80.952% + 1px), #7f2fa9 85.714%, #6a1eb4 calc(85.714% + 1px), #6a1eb4 90.476%, #580cc0 calc(90.476% + 1px), #580cc0 95.238%, #4900ca calc(95.238% + 1px) 100.000%)',
  },
  {
    id: 'ls-20',
    name: 'Pastel Bloom',
    css: 'linear-gradient(90deg, #f59eb6 0.000%, #f59eb6 7.692%, #fca8b7 calc(7.692% + 1px), #fca8b7 15.385%, #ffb3bc calc(15.385% + 1px), #ffb3bc 23.077%, #ffbec4 calc(23.077% + 1px), #ffbec4 30.769%, #ffc6ce calc(30.769% + 1px), #ffc6ce 38.462%, #feccd9 calc(38.462% + 1px), #feccd9 46.154%, #f8cee4 calc(46.154% + 1px), #f8cee4 53.846%, #f1cdef calc(53.846% + 1px), #f1cdef 61.538%, #e7c9f8 calc(61.538% + 1px), #e7c9f8 69.231%, #ddc1fe calc(69.231% + 1px), #ddc1fe 76.923%, #d2b7ff calc(76.923% + 1px), #d2b7ff 84.615%, #c6acff calc(84.615% + 1px), #c6acff 92.308%, #bca1ff calc(92.308% + 1px) 100.000%)',
  },
];
