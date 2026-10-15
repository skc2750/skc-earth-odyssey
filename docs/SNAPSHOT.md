# V3.1 snapshot provenance / 快照来源

- Experience: **SKC Earth Odyssey V3.1**, runtime API version **SKC Earth Odyssey 1.1**.
- Snapshot date: **2026-10-15**. Exact copy timestamp is in `snapshot-manifest.json`.
- Published source: **https://simonseow.com/migration/**.
- Source full release manifest SHA-256: **729AAE838B4FBF9F4E202C8E32330D8B0FC9880B71E6DE8C0F451A6A05B809BA**.
- Source manifest contains **187** public site files. Only the **112 `migration/` paths** and **`assets/skc-logo.png`** are copied into this standalone snapshot.
- These **113 files total 36,992,978 bytes**. Every copied file's byte count and SHA-256 are recorded in `snapshot-manifest.json`. The 112 migration files include source, runtime assets, fonts, supplied vendor code, credits and retained upstream notices.
- The copy was made from the verified published static payload, with every source and destination file checked against that release manifest. No original website, deployment payload or upstream checkout was edited while packaging.

## Package additions / 独立包装

The bilingual root entry, two live-space redirect stubs, local zero-dependency server, integrity verifier and package documentation are additions around the preserved experience. `.gitattributes` disables automatic line-ending conversion so cloning on Windows or another operating system does not change the published snapshot bytes.

Two complete supplemental vendor notices are supplied outside the runtime snapshot:

| File | Official source | SHA-256 |
| --- | --- | --- |
| `licenses/Draco-LICENSE.txt` | `https://raw.githubusercontent.com/google/draco/1.5.6/LICENSE` | `D3709B0FB4B8A94BBB1D02B8A2E484F258B0D9C5C5A01F940391F3FE662CD1A4` |
| `licenses/fflate-LICENSE.txt` | `https://raw.githubusercontent.com/101arrowz/fflate/v0.6.9/LICENSE` | `62249119BB7DF6E54300F37A37145C26A6D4420410AAC8881A119C5B427CF751` |

No secrets, environment files, hosting account linkage, local QA screenshots, research media, paid-tool files, build output or original upstream checkout are included. The wrapper contains no package dependencies, upload service, analytics or automatic deployment workflow. The dimension and mechanics stubs navigate to the existing public site; they do not copy those experiences.

上传这个独立仓库不会修改当前生产域名或部署。发布快照文件维持原字节；双语入口、本地服务与验证脚本是外围新增内容。独立 SKC 贡献的权利状态见 `LICENSING.md`，上游与第三方内容继续依各自原许可证。

## Verify / 验证

```sh
npm run verify
```

The verifier checks the 112-file runtime and logo hashes, exact package file inventory, absence of symbolic links and common credential/build paths, package identity and retained-rights metadata, local HTML link targets, supplemental license hashes, and actual loopback HTTP behavior including MIME, HEAD, byte ranges and traversal rejection. It prints a reproducible package tree hash without changing any files. Git metadata at the repository root is excluded from the inventory.
