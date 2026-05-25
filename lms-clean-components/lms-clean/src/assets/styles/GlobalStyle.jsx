import { T } from "./theme";

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'DM Sans',sans-serif;background:${T.bg};color:${T.text};min-height:100vh;overflow-x:hidden;}
    ::-webkit-scrollbar{width:5px;height:5px;}
    ::-webkit-scrollbar-track{background:${T.bg2};}
    ::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px;}
    ::-webkit-scrollbar-thumb:hover{background:${T.primary};}
    input,select,textarea{font-family:'DM Sans',sans-serif;}
    button,a{font-family:'DM Sans',sans-serif;cursor:pointer;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);}}
    @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
    @keyframes pulse{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(124,58,237,.7);}70%{transform:scale(1.05);box-shadow:0 0 0 12px rgba(124,58,237,0);}}
    @keyframes spin{to{transform:rotate(360deg);}}
    @keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
    @keyframes glow{0%,100%{box-shadow:0 0 15px rgba(124,58,237,.4);}50%{box-shadow:0 0 40px rgba(124,58,237,.8),0 0 80px rgba(6,182,212,.3);}}
    @keyframes zoomCard{from{transform:scale(.95);opacity:0;}to{transform:scale(1);opacity:1;}}
    .fade-up{animation:fadeUp .5s ease both;}
    .fade-in{animation:fadeIn .4s ease both;}
    .floating{animation:float 3s ease-in-out infinite;}
    .glowing{animation:glow 2s ease-in-out infinite;}


    /* =========================
       📱 MOBILE RESPONSIVE
       ========================= */

    @media (max-width: 768px){

      body{
        font-size:14px;
      }

      h1{font-size:24px;}
      h2{font-size:20px;}
      h3{font-size:18px;}

      button{
        padding:10px 14px;
        font-size:14px;
      }

      input, textarea{
        font-size:14px;
      }

      /* reduce animation intensity for mobile */
      .floating{
        animation:float 4s ease-in-out infinite;
      }

    }

    /* Extra small devices */
    @media (max-width: 480px){

      body{
        font-size:13px;
      }

      h1{font-size:20px;}
      h2{font-size:18px;}

      button{
        padding:8px 12px;
      }

    }

  `}</style>
);

export default GlobalStyle;
