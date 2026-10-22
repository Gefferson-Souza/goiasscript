for (let i = 0; i < 5; i = i + 1) {
  if (i === 2) { continue; }
  if (i === 4) { break; }
  console.log(i);
}