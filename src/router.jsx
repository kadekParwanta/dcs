import { useEffect, useState } from 'react';

const read = () => (window.location.hash.replace(/^#\/?/, '') || '').split('/');

export function useRoute() {
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export const navigate = (path) => {
  window.location.hash = '/' + path;
};

export const Link = ({ to, children, ...rest }) => (
  <a href={'#/' + to} {...rest}>
    {children}
  </a>
);
