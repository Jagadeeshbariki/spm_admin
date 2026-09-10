async function run() {
  const res = await fetch('http://localhost:3000/api/odk/image?submissionId=uuid:35271a1e-7834-4540-83ff-fdec1c462290&filename=1789031833934.jpg&formId=NF-%20Register');
  console.log('Status:', res.status, 'Type:', res.headers.get('content-type'));
  console.log(await res.text());
}
run();
