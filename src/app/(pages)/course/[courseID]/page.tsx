"use client"

import Container from "@/lib/components/container";
import Lectures from "./lectures";
import GlobalButton from "@/lib/components/global_button";
import { CourseProps, LectureProps } from "@/app/sample_data";
import GlobalComponents from "@/lib/components/global_components";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ReadCourseUseCase from "../../../../domain/course/read_course_use_case";
import ReadLectureUseCase from "../../../../domain/lecture/read_lecture_use_case";
import Loader from "@/lib/components/loader";
import CreateChapterUseCase from "../../../../domain/chapter/create_chapter_use_case";
import CreateLectureUseCase from "../../../../domain/lecture/create_lecture_use_case";

export default function Home() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false)
  const courseID = params.courseID as string;
  const [course, setCourse] = useState({} as CourseProps);
  const [lecture, setLecture] = useState<LectureProps[]>([]);
  const [open, setOpen] = useState(false);

  const getCourse = async () => {
    setLoading(true)
    const find_course_use_case = new ReadCourseUseCase();
    const res = await find_course_use_case.read();
    const courses = res.data;
    const course = courses?.find((course: CourseProps) => course.courseID === courseID);
    setCourse(course);
    getLectures();
    setLoading(false)
  }

  const getLectures = async () => {
    setLoading(true)
    const read_lecture_use_case = new ReadLectureUseCase();
    const res = await read_lecture_use_case.read(courseID);
    if (res.success) setLecture(res.data);
    setLoading(false)
  }

  useEffect(() => {
    getCourse()
  }, [])

  const base64ToBlob = (base64: string, contentType: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  };


  const addLecture = async (lectureName: string, file: File) => {
    if (!lectureName || !file) return alert("모든 항목을 입력해주세요.")

    setLoading(true)

    const create_lecture_use_case = new CreateLectureUseCase();
    const lecRes = await create_lecture_use_case.create(courseID, lectureName, file);
    if (!lecRes.success) return alert(lecRes.message)
    const lectureID = lecRes.data.lectureID;

    const create_chapter_use_case = new CreateChapterUseCase();
    const sampleChapters = [
      "Intelligent Agents",
      "Solving Problems by Searching",
      "Adversarial Search",
      "Constraint Satisfaction Problems",
      "Logical Agents",
      "Knowledge and Reasoning"
    ]
    sampleChapters.forEach(async (chapterName) => {
      await create_chapter_use_case.createSampleChapter(courseID, lectureID, chapterName);
    })

    getCourse();
    setLoading(false)
    setOpen(false)

    // const response1 = await fetch(`${route}/api/v1/gpt/dividepdf`, {
    //   method: "POST",
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     file
    //   }),
    // })
    // const response2 = await response1.json()
    // if (!response2.success) return alert(response2.message)
    // const data = response2.data
    // const files = data.pages.map((base64String: string, index: number) => {
    //   const blob = base64ToBlob(base64String, 'application/pdf');
    //   return new File([blob], `page-${index + 1}.pdf`, { type: 'application/pdf' });
    // });

    // const textPair: { file: File, text: string }[] = []
    // const service = new ConvertFileToTextService()
    // for (const file of files) {
    //   const response = await service.convert(file)
    //   const responseJson = await response.json()
    //   if (!responseJson.success) return alert(responseJson.message)
    //   const newPair = { file: file, text: responseJson.data.text }
    //   textPair.push(newPair)
    // }

    // const use_case = new CreateLectureAndGenerateChaptersUseCase();
    // const res = await use_case.createLecture(courseID, lectureName, lectureID, textPair);
    // if (res.success) {
    //   getCourse();
    //   setOpen(false);
    // }
  }
  return (
    <Container.MainContainer>
      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-row gap-4 items-end">
          <GlobalComponents.CourseName name={course?.courseName} />
          <GlobalComponents.CourseCode code={course?.courseCode} />
        </div>
        <GlobalComponents.ProfName name={course?.profName} />
      </div>
      <div className="flex flex-col gap-3 bg-neutral-100 p-5 mt-8" style={{ borderRadius: 20 }}>
        <div className="flex justify-between">
          <div className="text-h2-sb-20 pb-5">강의자료</div>
          <GlobalButton.AddButton text="강의자료 추가" onClick={() => setOpen(true)} />

        </div>
        <div className="flex flex-col gap-3" style={{ overflowY: "scroll", maxHeight: 650 }}>
          {lecture?.map((lecture: LectureProps, index: number) => (
            <Lectures.LectureItem
              key={index}
              lectureName={lecture.lectureName}
              createdAt={lecture.createdAt}
              treeClick={() => router.push(`/course/${courseID}/lecture/${lecture.lectureID}/tree`)}
              lectureClick={() => router.push(`/course/${courseID}/lecture/${lecture.lectureID}`)}
            />
          ))}
        </div>
      </div>
      <Lectures.AddLectureModal open={open} onClose={() => setOpen(false)} onClick={(e, file) => addLecture(e, file)} />
      {loading && <Loader />}
    </Container.MainContainer>
  );
}