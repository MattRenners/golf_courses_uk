import { Course } from '@/app/types';

interface CourseListProps {
  courses: Course[];
  selectedCourseId: number | null;
  onSelectCourse: (courseId: number) => void;
}

export default function CourseList({ courses, selectedCourseId, onSelectCourse }: CourseListProps) {
  if (courses.length === 0) {
    return <p className="text-stone-500 italic">No courses listed.</p>;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {courses.map((course) => (
        <button
          key={course.CourseId}
          onClick={() => onSelectCourse(course.CourseId)}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border ${
            selectedCourseId === course.CourseId
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-md transform scale-105'
              : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          {course.Name}
        </button>
      ))}
    </div>
  );
}
