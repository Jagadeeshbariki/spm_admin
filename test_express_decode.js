async function test() {
  const url1 = "http://localhost:3000/api/odk/image?submissionId=uuid:d2dbc941-8ba3-4f6b-b8cd-9cfd44316760&filename=1788866913433.jpg&formId=NF-%20Activities";
  const url2 = "http://localhost:3000/api/odk/image?submissionId=uuid%3Ad2dbc941-8ba3-4f6b-b8cd-9cfd44316760&filename=1788866913433.jpg&formId=NF-%20Activities";
  
  const res1 = await fetch(url1);
  const res2 = await fetch(url2);
  
  console.log("url1 status:", res1.status);
  console.log("url2 status:", res2.status);
}
test();
