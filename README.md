# 誓守襄阳 · Guardsong

微信小游戏单机原型 v0.4。

## 本机使用

```bash
git clone https://github.com/ChenLinping/guardsong.git
```

- 微信开发者工具：导入 `wechat/` 文件夹，已配置 AppID `wxc2db4261985fffa7`。
- 浏览器试玩：打开 `wechat/preview/index.html`。
- 工程说明：[wechat/README.md](wechat/README.md)。
- 更新：在仓库目录执行 `git pull --ff-only`。
- 逻辑测试：`node wechat/tests/core.cjs`。

已实现三关守城、有限弹药、一次性骑兵和伏兵、预埋陷坑、火器、滚木、暂停及存档。三关分别有315／405／480个敌方单位，含步兵、披甲兵、盾兵、弓手、游骑弓手、冲车、投石车。史料与游戏化边界见 [HISTORY.md](wechat/HISTORY.md)。未接入完整内政或真实好友求援；尚未完成微信开发者工具和真机验证，也未正式发布。
