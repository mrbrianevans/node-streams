// get user

const userId = "4606d324-8605-414b-8210-5ef5f9d68ec2";

// get profile from REST API
const profile = await fetch("http://localhost:3001/user?userId=" + userId).then(
  (r) => r.json()
);

console.log("User profile JSON", profile);

console.time("thousand requests");
await Promise.all(
  Array(1000)
    .fill(null)
    .map(() =>
      fetch("http://localhost:3001/user?userId=" + userId).then((r) => r.json())
    )
);
console.timeEnd("thousand requests");
