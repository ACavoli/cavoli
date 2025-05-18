import ApertureEffect from "@/components/ApertureEffect";
import { unstable_ViewTransition as ViewTransition } from 'react';
import Link from "next/link";
import HomeComponent from "@/components/Home"
import RectangleEffect from "@/components/RectangleEffect";

export default function Home() {
  return (
    <div>
      <ApertureEffect bladeCount={9} duration={2500} /> 
      <HomeComponent/>
      <RectangleEffect
      box1={
        <Link className="w-full h-full flex items-center justify-center" href="/database">
          <ViewTransition name="database">
          <span>Content Management</span>
          </ViewTransition>
        </Link>
      }
      box2={
        <div></div>
      }
      box3={
        <div></div>
      }
      box4={
        <div></div>
      }
      />
    </div>
  );
}
