"use client"

import Container from "@/lib/components/container"
import { useParams, useRouter } from "next/navigation"
import Components from "./components"
import { CourseProps, LectureProps } from "@/app/sample_data"
import ReadLectureUseCase from "../../../../../../domain/lecture/read_lecture_use_case"
import { useEffect, useState } from "react"
import ReadCourseUseCase from "../../../../../../domain/course/read_course_use_case"
import Lectures from "../../lectures"
import Loader from "@/lib/components/loader"
import ReactCrop, { type Crop } from 'react-image-crop'
import AnswerPromptUseCase from "../../../../../../domain/gpt/answer_prompt_use_case"

export default function LectureItem() {
    const params = useParams()
    const router = useRouter()
    const courseID = params.courseID as string
    const lectureID = params.lectureID as string
    const [loading, setLoading] = useState(false)
    const [lecture, setLecture] = useState({} as LectureProps)
    const [courses, setCourses] = useState({} as CourseProps)
    const [qna, setQna] = useState<{ question: string, nodes: { index: number, title: string, detail: string, pin: boolean }[] }[]>([])
    const [nodes, setNodes] = useState<any[]>([])
    const [crop, setCrop] = useState<Crop>()


    const readCourse = async () => {
        setLoading(true)
        const use_case = new ReadCourseUseCase()
        const res = await use_case.read(courseID)
        if (!res.success) alert("일시적인 오류가 발생했습니다. 관리자에게 문의주세요.")
        setCourses(res.data)
        setLoading(false)
    }

    const readLecture = async () => {
        setLoading(true)
        const use_case = new ReadLectureUseCase()
        const res = await use_case.read(courseID, lectureID)
        if (!res.success) alert("일시적인 오류가 발생했습니다. 관리자에게 문의주세요.")
        setLecture(res.data)
        setLoading(false)
    }

    useEffect(() => {
        readLecture()
        readCourse()
    }, [])


    const getPromptResponse = async (prompt: string) => {
        setLoading(true)
        const use_case = new AnswerPromptUseCase()
        const response = await use_case.generate(prompt)
        const data = response.data.map((node: any) => {
            return {
                index: node.index,
                title: node.title,
                detail: node.detail,
                pin: false
            }
        })
        const newQna = [...qna]
        newQna.push({
            question: prompt,
            nodes: [...data]
        })
        setQna(newQna)
        setLoading(false)
    }

    const clickPin = (data: { index: number, title: string, detail: string, pin: boolean }, id: number) => {
        const newQna = [...qna]
        newQna[id].nodes = newQna[id].nodes.map((node: any) => {
            if (parseInt(node.index) === data.index) {
                if (!nodes.includes(node.title)) {
                    setNodes([...nodes, node.title])
                    return {
                        index: node.index,
                        title: node.title,
                        detail: node.detail,
                        pin: !node.pin
                    }
                } else {
                    setNodes(nodes.filter((title: string) => title !== node.title))
                    return {
                        index: node.index,
                        title: node.title,
                        detail: node.detail,
                        pin: !node.pin
                    }
                }
            }
            return node
        })
        setQna(newQna)
    }

    const createNode = (title: string) => {
        // TODO: LLM 개발하고 나서 할 것
    }

    return (
        <Container.WideContainer>
            <div className="pb-8 h-full" style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                columnGap: 20
            }}>
                <div className="items-center px-5 flex flex-col gap-5">
                    <div className="flex flex-col gap-3 w-full">
                        <div className="flex gap-4 items-center">
                            <div className="text-h3-m-16">{courses.courseName}</div>
                            <div className="text-body-r-16 text-neutral-600">{courses.courseCode}</div>
                        </div>
                        <Components.CourseContentToggle lectureName={lecture.lectureName} />
                    </div>
                    <div className="w-full flex-grow bg-neutral-200 relative" style={{
                        borderRadius: 20
                    }}>
                        <ReactCrop crop={crop} onChange={c => { setCrop(c); console.log(c) }}></ReactCrop>
                        {lecture.fileURL &&
                            <Lectures.PDFViewer fileURL={lecture.fileURL} />
                        }
                    </div>
                    <div className="absolute" style={{ bottom: 32 }}>
                        <Components.ToolTip />
                    </div>
                </div>

                <div className="flex flex-col gap-9">
                    <div className="flex flex-col gap-2">
                        <Components.BreadCrumbs crumbs={[courses.courseName, lecture.lectureName]} />
                        <Components.NodeMap
                            createNode={() => { }}
                            seeTree={() => router.push(`/course/${courseID}/lecture/${lectureID}/tree`)}
                            nodes={nodes}
                            deliverNewNodes={(newNodes: any) => setNodes(newNodes)}
                        />
                    </div>
                    <div className="flex flex-col gap-2" style={{ height: 600, overflowY: "scroll" }}>
                        <div className="flex-grow w-full">
                            {qna.map((data, index) => (
                                <Components.QnA
                                    key={index}
                                    question={data.question}
                                    answerData={data.nodes}
                                    pinClick={data => clickPin(data, index)}
                                />
                            ))}
                        </div>
                    </div>
                    <Components.PromptInput
                        sendPrompt={(e) => getPromptResponse(e)}
                    />
                </div>
            </div>
            {loading && <Loader />}
        </Container.WideContainer>
    )
}