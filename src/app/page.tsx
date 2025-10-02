export default async function Home() {
    const data = await fetch("http://localhost:3000/");
    const content = await data.text();
    return (
        <p>{content}</p>
    );
}
