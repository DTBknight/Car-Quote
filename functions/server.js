const express = require('express');
const serverless = require('serverless-http');
const fs = require('fs');
const path = require('path');

const app = express();

// 嵌入品牌数据
const brandsData = [
  {
    "name": "东风风神",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/603dedb8f70ad1ec6cd3fc97c0cbbb11~tplv-resize:100:100.image",
    "file": "Aeolus.json"
  },
  {
    "name": "埃安",
    "brandImage": "https://p3-dcd.byteimg.com/img/tos-cn-i-dcdx/2a02c59e2eec44fbac93a7f1f0179457~tplv-resize:0:0.png",
    "file": "Aion.json"
  },
  {
    "name": "问界",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/b98df48107bc3529e1a8b4b637fceb98~tplv-resize:100:100.image",
    "file": "Aito.json"
  },
  {
    "name": "阿尔法·罗密欧",
    "brandImage": "https://p9-dcd.byteimg.com/img/tos-cn-i-dcdx/c32957653bbe4d958931ba009ebcc8b7~tplv-resize:0:0.png",
    "file": "AlfaRomeo.json"
  },
  {
    "name": "极狐",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/5a5a4f58444966bda9e528afc5c14df7~tplv-resize:100:100.image",
    "file": "Arcfox.json"
  },
  {
    "name": "阿斯顿马丁",
    "brandImage": "https://p3-dcd.byteimg.com/img/tos-cn-i-dcdx/c60f4d8c5cd7418093eb6fee4729d2bf~tplv-resize:0:0.png",
    "file": "AstonMartin.json"
  },
  {
    "name": "奥迪",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/62946ba030f3589e083d8d3e98a595eb~tplv-resize:100:100.image",
    "file": "Audi.json"
  },
  {
    "name": "阿维塔",
    "brandImage": "https://p3-dcd.byteimg.com/img/tos-cn-i-dcdx/653ad03cc7fd49abbe5e6b6fe2a7e2ce~tplv-resize:0:0.png",
    "file": "Avatr.json"
  },
  {
    "name": "北京汽车",
    "brandImage": "https://p3-dcd.byteimg.com/img/tos-cn-i-dcdx/6e45af447ab741c2862fd7e91c027432~tplv-resize:0:0.png?psm=motor.car_page.go_api",
    "file": "BAIC.json"
  },
  {
    "name": "北京汽车制造厂",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/f921574ac8c4f4e1cc0769ea2029f57d~tplv-resize:100:100.image",
    "file": "BAW.json"
  },
  {
    "name": "北京越野",
    "brandImage": "https://p9-dcd.byteimg.com/img/tos-cn-i-dcdx/27aaa6f467454c4bb26fed0a212640bc~tplv-resize:0:0.png?psm=motor.car_page.go_api",
    "file": "BJSUV.json"
  },
  {
    "name": "宝马",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/4867710a834bd648ba55797ba5e37f14~tplv-resize:100:100.image",
    "file": "BMW.json"
  },
  {
    "name": "比亚迪",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/10a76eee736808997549bbb0f716e1cb~tplv-resize:100:100.image",
    "file": "BYD.json"
  },
  {
    "name": "宝骏",
    "brandImage": "https://p1-dcd.byteimg.com/img/tos-cn-i-dcdx/51ffce1dd9d4347953c966f2fd6b20c~tplv-resize:0:0.png",
    "file": "Baojun.json"
  },
  {
    "name": "宾利",
    "brandImage": "https://p9-dcd.byteimg.com/img/tos-cn-i-dcdx/0e5eb93d307048938f67924863f8d7b3~tplv-resize:0:0.png?psm=motor.car_page.go_api",
    "file": "Bentley.json"
  },
  {
    "name": "奔驰",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/84c01ab4bb1f55a4809781b3a16586ff~tplv-resize:100:100.image",
    "file": "Benz.json"
  },
  {
    "name": "奔腾",
    "brandImage": "https://p1-dcd.byteimg.com/img/tos-cn-i-dcdx/bf354d6392e44dda9521e4059ae88e21~tplv-resize:0:0.png",
    "file": "Besturn.json"
  },
  {
    "name": "别克",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/d43a7581e90f508acb9bceb87faaed84~tplv-resize:100:100.image",
    "file": "Buick.json"
  },
  {
    "name": "凯迪拉克",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/e5023f5e3801a57c82644547c6f3b2a8~tplv-resize:100:100.image",
    "file": "Cadillac.json"
  },
  {
    "name": "长安",
    "brandImage": "https://p3-dcd.byteimg.com/img/tos-cn-i-dcdx/7460909912f44a8391ba22a7fd008867~tplv-resize:0:0.png",
    "file": "Changan.json"
  },
  {
    "name": "长安启源",
    "brandImage": "https://p9-dcd.byteimg.com/img/tos-cn-i-dcdx/44aa0406ba774fcda90d5c77e4bd61c8~tplv-resize:0:0.png?psm=motor.car_page.go_api",
    "file": "ChanganNevo.json"
  },
  {
    "name": "奇瑞",
    "brandImage": "https://p9-dcd.byteimg.com/img/tos-cn-i-dcdx/597f4a56ea1b4cf48e3cd06704e0a361~tplv-resize:0:0.png",
    "file": "Chery.json"
  },
  {
    "name": "雪佛兰",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/ae65202f5d1e39a2052acdf18afa5d14~tplv-resize:100:100.image",
    "file": "Chevrolet.json"
  },
  {
    "name": "雪铁龙",
    "brandImage": "https://p3-dcd.byteimg.com/img/tos-cn-i-dcdx/22ec2bec34d240bcad6f54d54ece1f1c~tplv-resize:0:0.png",
    "file": "Citroen.json"
  },
  {
    "name": "DS",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/ca1fd6560e4c4cad385aef01512bc28a~tplv-resize:100:100.image",
    "file": "DS.json"
  },
  {
    "name": "深蓝",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/6fa07456e4ab57573ee49f17fe72941d~tplv-resize:100:100.image",
    "file": "Deepal.json"
  },
  {
    "name": "腾势",
    "brandImage": "https://p3-dcd.byteimg.com/img/tos-cn-i-dcdx/8fd7ef0920364b3ead617d19ca49472c~tplv-resize:0:0.png?psm=motor.car_page.go_api",
    "file": "Denza.json"
  },
  {
    "name": "东风",
    "brandImage": "https://p1-dcd.byteimg.com/img/tos-cn-i-dcdx/f7cf20ec75014574b5afe7be0899e118~tplv-resize:0:0.png",
    "file": "Dongfeng.json"
  },
  {
    "name": "一汽",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/55fe313b27dbd598e4afc7da5ae88c49~tplv-resize:100:100.image",
    "file": "FAW.json"
  },
  {
    "name": "东风风光",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/d2f83dcd61d909426b492bbd9c3d4c72~tplv-resize:100:100.image",
    "file": "Fengon.json"
  },
  {
    "name": "法拉利",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/30f928f03a9e85dc1d6ce484cb0e938f~tplv-resize:100:100.image",
    "file": "Ferrari.json"
  },
  {
    "name": "萤火虫",
    "brandImage": "https://p9-dcd.byteimg.com/img/tos-cn-i-dcdx/943c305bb3b0494d878b6384d12e0939~tplv-resize:0:0.png?psm=motor.car_page.go_api",
    "file": "Firefly.json"
  },
  {
    "name": "福特",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/26bf5049dc5224161785225163fe6959~tplv-resize:100:100.image",
    "file": "Ford.json"
  },
  {
    "name": "方程豹",
    "brandImage": "https://p3-dcd.byteimg.com/img/tos-cn-i-dcdx/5b96a8b1836d4107878280cd08b7c453~tplv-resize:0:0.png",
    "file": "FormulaLeopard.json"
  },
  {
    "name": "东风风行",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/51504ccf9decf37772e06597572c57f7~tplv-resize:100:100.image",
    "file": "Forthing.json"
  },
  {
    "name": "福田",
    "brandImage": "",
    "file": "Foton.json"
  },
  {
    "name": "GMC",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/bd2e6eafdd8daa08be5fe7c045b99105~tplv-resize:100:100.image",
    "file": "GMC.json"
  },
  {
    "name": "长城",
    "brandImage": "https://p3-dcd.byteimg.com/img/tos-cn-i-dcdx/15ebf67f59f2475ebf196b161f208be9~tplv-resize:0:0.png?psm=motor.car_page.go_api",
    "file": "GWM.json"
  },
  {
    "name": "吉利",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/1badee776354a960ac16444f51dad339~tplv-resize:100:100.image",
    "file": "Geely.json"
  },
  {
    "name": "吉利银河",
    "brandImage": "https://p1-dcd.byteimg.com/img/tos-cn-i-dcdx/8bac8e50316b4b96b9f9f58915dc7266~tplv-resize:0:0.png",
    "file": "GeelyGalaxy.json"
  },
  {
    "name": "捷尼赛思",
    "brandImage": "https://p9-dcd.byteimg.com/img/tos-cn-i-dcdx/2d8f540b073b4c7db478f278ec242ad1~tplv-resize:0:0.png",
    "file": "Genesis.json"
  },
  {
    "name": "吉利几何",
    "brandImage": "https://p3-dcd.byteimg.com/img/tos-cn-i-dcdx/a8a1a985444a49f7ba41fd8acb55106e~tplv-resize:0:0.png?psm=motor.car_page.go_api",
    "file": "Geome.json"
  },
  {
    "name": "海马",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/f85275e1f085c25d14e894c4d17c2795~tplv-resize:100:100.image",
    "file": "Hama.json"
  },
  {
    "name": "哈弗",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/d557d170618043b5911d036fa7c8263f~tplv-resize:100:100.image",
    "file": "Haval.json"
  },
  {
    "name": "恒驰",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/e6ce944f11e0db6c9aa2c3843ef50c5c~tplv-resize:100:100.image",
    "file": "Hengchi.json"
  },
  {
    "name": "本田",
    "brandImage": "https://p1-dcd.byteimg.com/img/tos-cn-i-dcdx/ce848b3a359d48ee97a3ffbc79c99aa8~tplv-resize:0:0.png",
    "file": "Honda.json"
  },
  {
    "name": "红旗",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/9a2cf4552de5fd67f7f3a1f241ed9b48~tplv-resize:100:100.image",
    "file": "Hongqi.json"
  },
  {
    "name": "合创",
    "brandImage": "https://p3-dcd.byteimg.com/img/tos-cn-i-dcdx/4f077a35cfec413eb8dbb76751fa7f29~tplv-resize:0:0.png",
    "file": "Hycan.json"
  },
  {
    "name": "广汽昊铂",
    "brandImage": "https://p3-dcd.byteimg.com/img/tos-cn-i-dcdx/e3ff1783b1f64295877464e9f7340002~tplv-resize:0:0.png",
    "file": "Hyper.json"
  },
  {
    "name": "现代",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/6af469ddb92b4c24628c5884ab323f21~tplv-resize:100:100.image",
    "file": "Hyundai.json"
  },
  {
    "name": "智己",
    "brandImage": "https://p3-dcd.byteimg.com/img/tos-cn-i-dcdx/797a3d3a8c5940b282b936994c39696b~tplv-resize:0:0.png?psm=motor.car_page.go_api",
    "file": "IM.json"
  },
  {
    "name": "英菲尼迪",
    "brandImage": "https://p3-dcd.byteimg.com/img/tos-cn-i-dcdx/2458a930c2c04a9c9f6bf6897840c491~tplv-resize:0:0.png",
    "file": "Infiniti.json"
  },
  {
    "name": "江淮",
    "brandImage": "",
    "file": "JAC.json"
  },
  {
    "name": "江铃",
    "brandImage": "",
    "file": "JMC.json"
  },
  {
    "name": "捷豹",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/9ca75c567fa6804e672fab69c9697d92~tplv-resize:100:100.image",
    "file": "Jaguar.json"
  },
  {
    "name": "Jeep",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/119d2dd7d9eef704e7d3135334996e6b~tplv-resize:100:100.image",
    "file": "Jeep.json"
  },
  {
    "name": "捷途",
    "brandImage": "https://p3-dcd.byteimg.com/img/tos-cn-i-dcdx/4ae0e6b3285d45beb52c9d545b9ebe04~tplv-resize:0:0.png?psm=motor.car_page.go_api",
    "file": "Jetour.json"
  },
  {
    "name": "捷达",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/7f456a5056c5aee7e1b8d416f031c472~tplv-resize:100:100.image",
    "file": "Jetta.json"
  },
  {
    "name": "长安凯程",
    "brandImage": "",
    "file": "Kaicene.json"
  },
  {
    "name": "凯翼",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/72d2dee2c3bfdb738816da63d38bab89~tplv-resize:100:100.image",
    "file": "Kaiyi.json"
  },
  {
    "name": "起亚",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/9997244f9934fdebe915cde58bb2ddf2~tplv-resize:100:100.image",
    "file": "Kia.json"
  },
  {
    "name": "柯尼赛格",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/9639b0197a3ce749e9dbf20ce683f9fe~tplv-resize:100:100.image",
    "file": "Koenigsegg.json"
  },
  {
    "name": "兰博基尼",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/8cd3841160b7fbfbc06547175e2aa7c1~tplv-resize:100:100.image",
    "file": "Lamborghini.json"
  },
  {
    "name": "路虎",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/2c52e02dd202db11ffaf361a38ca44ac~tplv-resize:100:100.image",
    "file": "LandRover.json"
  },
  {
    "name": "蓝电",
    "brandImage": "",
    "file": "Landian.json"
  },
  {
    "name": "零跑",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/71d99bd884bb2038ab560981fef08ae7~tplv-resize:100:100.image",
    "file": "Leapmotor.json"
  },
  {
    "name": "雷克萨斯",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/b43814293efa6db10b762da4d351bfe7~tplv-resize:100:100.image",
    "file": "Lexus.json"
  },
  {
    "name": "理想",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/25321616a634e8f615a9c4225f792be2~tplv-resize:100:100.image",
    "file": "LiAuto.json"
  },
  {
    "name": "林肯",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/6bad2891b5ccfb6b538c73b1d236ed59~tplv-resize:100:100.image",
    "file": "Lincoln.json"
  },
  {
    "name": "睿蓝",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/885955536a00de6300b53d2d3a111b27~tplv-resize:100:100.image",
    "file": "Livan.json"
  },
  {
    "name": "莲花",
    "brandImage": "https://p9-dcd.byteimg.com/img/tos-cn-i-dcdx/46343be41125443aac7d0faa9be02eda~tplv-resize:0:0.png?psm=motor.car_page.go_api",
    "file": "Lotus.json"
  },
  {
    "name": "智界",
    "brandImage": "https://p9-dcd.byteimg.com/img/tos-cn-i-dcdx/8bad52bb65cf46c2838bee71dd134763~tplv-resize:0:0.png?psm=motor.car_page.go_api",
    "file": "Luxeed.json"
  },
  {
    "name": "领克",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/ef40e34ea01b91d1be9f49d71d0cb0b4~tplv-resize:100:100.image",
    "file": "LynkCo.json"
  },
  {
    "name": "名爵",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/9556900e24b43302eec0d91b4545426f~tplv-resize:100:100.image",
    "file": "MG.json"
  },
  {
    "name": "尊界",
    "brandImage": "https://p3-dcd.byteimg.com/img/tos-cn-i-dcdx/2fea0e3c6d2c4f6a8dacbf97d101489a~tplv-resize:0:0.png?psm=motor.car_page.go_api",
    "file": "Maextro.json"
  },
  {
    "name": "玛莎拉蒂",
    "brandImage": "https://p9-dcd.byteimg.com/img/tos-cn-i-dcdx/ad3fe8a317d543a68cb8ab1c5925d283~tplv-resize:0:0.png",
    "file": "Maserati.json"
  },
  {
    "name": "上汽大通",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/00dc924de414edc53779b408f13df233~tplv-resize:100:100.image",
    "file": "Maxus.json"
  },
  {
    "name": "马自达",
    "brandImage": "https://p3-dcd.byteimg.com/img/tos-cn-i-dcdx/c3da023df833436b831e57ca541859d9~tplv-resize:0:0.png?psm=motor.car_page.go_api",
    "file": "Mazda.json"
  },
  {
    "name": "迈凯轮",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/f60054392213a036e2df0a462676f86a~tplv-resize:100:100.image",
    "file": "McLaren.json"
  },
  {
    "name": "猛士",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/80569b9c40d60aedc2860a4ba3f09afd~tplv-resize:100:100.image",
    "file": "Mhero.json"
  },
  {
    "name": "MINI",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/28df10b415f192d7045cf645fea11f30~tplv-resize:100:100.image",
    "file": "Mini.json"
  },
  {
    "name": "东风纳米",
    "brandImage": "https://p3-dcd.byteimg.com/img/tos-cn-i-dcdx/d76ab376af94443997a5ad66699a3dc0~tplv-resize:0:0.png",
    "file": "Nami.json"
  },
  {
    "name": "哪吒",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/1f5e4e807a24a6355201bea736d3baf7~tplv-resize:100:100.image",
    "file": "Neta.json"
  },
  {
    "name": "蔚来",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/f178e29e06e5491eb09096415259e95e~tplv-resize:100:100.image",
    "file": "Nio.json"
  },
  {
    "name": "日产",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/5feee803f00613b3dfb9ec977192deb5~tplv-resize:100:100.image",
    "file": "Nissan.json"
  },
  {
    "name": "乐道",
    "brandImage": "https://p9-dcd.byteimg.com/img/tos-cn-i-dcdx/e58b27580d2f4ede8c67ac6c0d306ca4~tplv-resize:0:0.png",
    "file": "Onvo.json"
  },
  {
    "name": "欧拉",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/28d3b85cbc8e1bb2c0e643931ec1baf3~tplv-resize:100:100.image",
    "file": "Ora.json"
  },
  {
    "name": "标致",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/0929d7fb1f98a067e02567cbf81db1e9~tplv-resize:100:100.image",
    "file": "Peugeot.json"
  },
  {
    "name": "极星",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/bc0b6d995581dc7821541b0d83256f92~tplv-resize:100:100.image",
    "file": "Polestar.json"
  },
  {
    "name": "保时捷",
    "brandImage": "https://p3-dcd.byteimg.com/img/tos-cn-i-dcdx/d809a071a391474c8067edeb637c328f~tplv-resize:0:0.png",
    "file": "Porsche.json"
  },
  {
    "name": "飞凡",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/e480bbf25c481fced2b4004576b39377~tplv-resize:100:100.image",
    "file": "RisingAuto.json"
  },
  {
    "name": "荣威",
    "brandImage": "https://p9-dcd.byteimg.com/img/tos-cn-i-dcdx/97bea75b96b34fe3872344e046907cde~tplv-resize:0:0.png",
    "file": "Roewe.json"
  },
  {
    "name": "劳斯莱斯",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/e7357c5b6d10aff66747da83bdb78f99~tplv-resize:100:100.image",
    "file": "RollsRoyce.json"
  },
  {
    "name": "极石",
    "brandImage": "https://p3-dcd.byteimg.com/img/tos-cn-i-dcdx/22c8e7c239c546f9a35b08ae9a4d1ec6~tplv-resize:0:0.png?psm=motor.car_page.go_api",
    "file": "Rox.json"
  },
  {
    "name": "斯柯达",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/3ec788e28d2647bec8fc7b6f0f551a69~tplv-resize:100:100.image",
    "file": "Skoda.json"
  },
  {
    "name": "创维",
    "brandImage": "https://p9-dcd.byteimg.com/img/tos-cn-i-dcdx/899bcccd66d5439ab7c6ff835f24fe43~tplv-resize:0:0.png",
    "file": "Skyworth.json"
  },
  {
    "name": "Smart",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/8f2f638de644c38c7a228a72abe8e85d~tplv-resize:100:100.image",
    "file": "Smart.json"
  },
  {
    "name": "享界",
    "brandImage": "https://p3-dcd.byteimg.com/img/tos-cn-i-dcdx/a52c0c58aee045e8802d5aa5bb835237~tplv-resize:0:0.png?psm=motor.car_page.go_api",
    "file": "Stelato.json"
  },
  {
    "name": "斯巴鲁",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/b7f695f8d411ad395ebbf4f5bb003914~tplv-resize:100:100.image",
    "file": "Subaru.json"
  },
  {
    "name": "坦克",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/17fca7e0dec078194be0cf6248c79706~tplv-resize:100:100.image",
    "file": "Tank.json"
  },
  {
    "name": "特斯拉",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/222f2748c0d6e9c69c00a304f2ac8da1~tplv-resize:100:100.image",
    "file": "Tesla.json"
  },
  {
    "name": "丰田",
    "brandImage": "https://p1-dcd.byteimg.com/img/tos-cn-i-dcdx/66f2b4fa526340c589fe5d2b6bdd4d11~tplv-resize:0:0.png",
    "file": "Toyota.json"
  },
  {
    "name": "广汽传祺",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/dfddc97d247ec51e0fa082ebcfd7ad4e~tplv-resize:100:100.image",
    "file": "Trumpchi.json"
  },
  {
    "name": "大众",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/343173efb2ab28cda1b0e5a5b49dab8e~tplv-resize:100:100.image",
    "file": "Volkswagen.json"
  },
  {
    "name": "沃尔沃",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/c06fae433bcc4a55d7ef3b519704781c~tplv-resize:100:100.image",
    "file": "Volvo.json"
  },
  {
    "name": "岚图",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/986dac13d0d128da9aabb3df683e9b34~tplv-resize:100:100.image",
    "file": "Voyah.json"
  },
  {
    "name": "魏牌",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/8cbb2f506df822a62398c09b104889cf~tplv-resize:100:100.image",
    "file": "Wey.json"
  },
  {
    "name": "五菱",
    "brandImage": "https://p3-dcd.byteimg.com/img/tos-cn-i-dcdx/f15a9d56604247ffb3183b1781d0cfb5~tplv-resize:0:0.png",
    "file": "Wuling.json"
  },
  {
    "name": "小米",
    "brandImage": "https://p9-dcd.byteimg.com/img/tos-cn-i-dcdx/a2994c3b381f4abfba82e8ee7a372b38~tplv-resize:0:0.png",
    "file": "Xiaomi.json"
  },
  {
    "name": "小鹏",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/45643feed53220ec5159662049ecb330~tplv-resize:100:100.image",
    "file": "Xpeng.json"
  },
  {
    "name": "仰望",
    "brandImage": "https://p9-dcd.byteimg.com/img/tos-cn-i-dcdx/6e4a8cc4cdc842b6b2b94d24f18a4c8c~tplv-resize:0:0.png",
    "file": "Yangwang.json"
  },
  {
    "name": "极氪",
    "brandImage": "https://p1-dcd.byteimg.com/img/motor-mis-img/f44eceb65e1590ab7aaab48a698feeed~tplv-resize:100:100.image",
    "file": "Zeekr.json"
  },
  {
    "name": "212",
    "brandImage": "https://p3-dcd.byteimg.com/img/tos-cn-i-dcdx/8fc2d7b06c534cb096848256ce3a8bef~tplv-resize:0:0.png",
    "file": "_212.json"
  },
  {
    "name": "东风奕派",
    "brandImage": "https://p3-dcd.byteimg.com/img/tos-cn-i-dcdx/6d63563d575347e38da80de539a2f6d7~tplv-resize:0:0.png",
    "file": "eπ.json"
  },
  {
    "name": "iCAR",
    "brandImage": "https://p9-dcd.byteimg.com/img/tos-cn-i-dcdx/915e23fe357d4fd6a1c53905e15eda54~tplv-resize:0:0.png",
    "file": "iCAR.json"
  }
];

// 内存缓存
let brandsCache = null;
let carsCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 允许跨域
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// 获取所有汽车数据
app.get('/api/cars', async (req, res) => {
  // 检查缓存
  const now = Date.now();
  if (carsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return res.json(carsCache);
  }

    const dataDir = './data';

  try {
    const files = await fs.promises.readdir(dataDir);
    const jsonFiles = files.filter(file => file.endsWith('.json') && file !== 'brands.json');
    
    if (jsonFiles.length === 0) {
      carsCache = [];
      cacheTimestamp = now;
      return res.json(carsCache);
    }

    // 并行读取所有文件
    const readPromises = jsonFiles.map(async (file) => {
      const filePath = path.join(dataDir, file);
      try {
        const data = await fs.promises.readFile(filePath, 'utf-8');
        const carData = JSON.parse(data);
        if (Array.isArray(carData)) {
          return carData;
        } else if (carData.cars && Array.isArray(carData.cars)) {
          return carData.cars;
        }
        return [];
      } catch (err) {
        console.error(`解析文件 ${file} 失败:`, err);
        return [];
      }
    });

    const results = await Promise.all(readPromises);
    const allCars = results.flat();

    // 更新缓存
    carsCache = allCars;
    cacheTimestamp = now;
    
    res.json(allCars);
  } catch (err) {
    res.status(500).json({ error: '读取数据目录失败' });
  }
});

// 获取所有品牌列表
app.get('/api/brands', async (req, res) => {
  // 检查缓存
  const now = Date.now();
  if (brandsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return res.json(brandsCache);
  }

  try {
    // 直接使用嵌入的品牌数据
    const brands = brandsData;
    
    // 更新缓存
    brandsCache = brands;
    cacheTimestamp = now;
    
    res.json(brands);
  } catch (err) {
    console.error('获取品牌数据失败:', err);
    res.status(500).json({ error: '读取品牌数据失败' });
  }
});

// 获取特定品牌的车数据
app.get('/api/brands/:brand', async (req, res) => {
  const brand = req.params.brand;
  const { page = 1, limit = 20, search = '' } = req.query;
  
  try {
    // 直接使用嵌入的品牌数据
    const brands = brandsData;
    
    // 查找匹配的品牌
    const brandInfo = brands.find(b => b.name === brand);
    if (!brandInfo) {
      return res.status(404).json({ error: '品牌不存在' });
    }
    
    const dataPath = path.join('./data', brandInfo.file);
    const data = await fs.promises.readFile(dataPath, 'utf-8');
    const carData = JSON.parse(data);
    
    // 保持原始数据结构，添加品牌信息
    const result = {
      brand: brand,
      brandImage: carData.brandImage || '',
      cars: carData.cars || carData || []
    };
    
    // 如果有搜索参数，进行过滤
    if (search) {
      result.cars = result.cars.filter(car => 
        car.name && car.name.toLowerCase().includes(search.toLowerCase()) ||
        car.configName && car.configName.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // 如果有分页参数，进行分页
    if (page && limit) {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      result.cars = result.cars.slice(startIndex, endIndex);
      result.total = result.cars.length;
      result.page = parseInt(page);
      result.limit = parseInt(limit);
    }
    
    res.json(result);
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.status(404).json({ error: '品牌不存在' });
    } else {
      res.status(500).json({ error: '数据格式错误' });
    }
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

module.exports.handler = serverless(app); 