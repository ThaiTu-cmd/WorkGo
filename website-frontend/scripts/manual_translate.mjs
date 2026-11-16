import fs from 'fs';
const en=JSON.parse(fs.readFileSync('src/dictionaries/en.json','utf8'));
const updates={
 m1240: "{p0}{p1}",
 m1447: 'Searching: "{p0}"',
 m1448: "Could not log in: {p0}",
 m1449: "Could not register: {p0}",
 m1450: "{p0} profile {p1}!",
 m1451: "Could not create order: {p0}",
 m1452: "Could not change status: {p0}",
 m1453: "Over 2 MB, send via link: {p0}",
 m1454: "Submit work {p0}",
 m1455: "Remove {p0}",
 m1456: "Cancel request ({p0}):",
 m1457: "Cancel reason — {p0}:",
 m1458: "Delete card {p0}",
 m1459: "Could not save service: {p0}",
 m1460: "Order{p0}",
 m1461: "Minimum amount is {p0} ₫!",
 m1462: "Amount exceeds {p0} ₫ allowed!",
 m1463: "Could not save profile: {p0}",
 m1464: "Could not send profile: {p0}",
};
for(const k in updates){ en.misc[k]=updates[k]; }
fs.writeFileSync('src/dictionaries/en.json',JSON.stringify(en,null,2)+'\n');
console.log('done');