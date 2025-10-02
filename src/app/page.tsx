export default async function Home() {
    let data = await fetch("http://localhost:3000/");
    let content = await data.text();
    return (
        <p>{content}</p>
    );
}
