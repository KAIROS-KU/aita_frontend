export async function POST(request: Request) {
    try {
        const { file } = await request.json();

        const firebaseFunctionUrl = 'https://asia-northeast3-kairos-3326d.cloudfunctions.net/detectText';

        const fileType = 'pdf'

        const response = await fetch(firebaseFunctionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fileType,
                image: file
            })
        });
        return response

        return new Response(
            JSON.stringify({
                success: true,
                message: '텍스트 추출에 성공했습니다',
                data: response,
            }),
        )
    } catch (error) {
        return new Response(
            JSON.stringify({
                success: false,
                message: '텍스트 추출에 실패했습니다',
                data: error,
            }),
        )
    }
}