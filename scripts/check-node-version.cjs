const major = Number(process.versions.node.split('.')[0])

if (major !== 18) {
  console.error(
    [
      '',
      `当前 Node 版本是 ${process.version}，本项目要求 Node 18.x。`,
      '请先执行：',
      '',
      '  nvm use',
      '',
      '然后再运行 npm run dev / npm run build。',
      '',
    ].join('\n'),
  )
  process.exit(1)
}
